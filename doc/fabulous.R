#Regenerate the graph based on the work @jkunst.com

#Reference
#http://jkunst.com/r/what-do-we-ask-in-stackoverflow/

#if there exists error in install.packages
#defaults write org.R-project.R force.LANG en_US.UTF-8
#restart

install.packages("dplyr")
install.packages("RSQLite")
install.packages("ggplot2")
install.packages("plyr")
install.packages("igraph")
install.packages("viridisLite")
install.packages("data.table")
install.packages("networkd3")
install.packages("purrr")
install.packages("devtools")
devtools::install_github("analyxcompany/resolution")
devtools::install_github("dill/beyonce")

library("dplyr")
library("RSQLite")
library("resolution")
library("viridisLite")
library("networkD3")
library("purrr")

# Example
# dplyr::src_sqlite()

db <- src_sqlite("~/Desktop/7507.db")
dfqst <- tbl(db, "questions")
dftags <- tbl(db, "questions_tags")

# Start

dfqst <- dfqst %>% mutate(creation_year = substr(creation_date, 0, 5))
dftags2 <- left_join(dftags, dfqst %>% select(question_id, creation_year), by = c("id" = "question_id"))
dftags3 <- dftags2 %>%
  group_by(creation_year, tag) %>%
  summarize(count = n()) %>%
  arrange(creation_year, -count) %>%
  collect()

tops <- 30
dftags4 <- dftags3 %>%
  group_by(creation_year) %>%
  mutate(rank = row_number()) %>%
  ungroup() %>%
  filter(rank <= tops) %>%
  mutate(rank = factor(rank, levels = rev(seq(tops))),
         creation_year = as.numeric(creation_year))

dftags5 <- dftags4 %>%
    filter(creation_year == max(creation_year)) %>%
    mutate(creation_year = as.numeric(creation_year) + 0.25)

dftags6 <- dftags4 %>%
    filter(creation_year == min(creation_year)) %>%
    mutate(creation_year = as.numeric(creation_year) - 0.25)

colors <- c("asp.net" = "#6a40fd", "r" = "#198ce7", "css" = "#563d7c", "javascript" = "#f1e05a",
            "json" = "#f1e05a", "android" = "#b07219", "arrays" = "#e44b23", "xml" = "green")

othertags <- dftags4 %>% distinct(tag) %>% filter(!tag %in% names(colors)) %>% .$tag
colors <- c(colors, setNames(rep("gray", length(othertags)), othertags))

p <- ggplot2::ggplot(mapping = ggplot2::aes(creation_year, y = rank, group = tag, color = tag)) +
  ggplot2::geom_line(size = 1.7, alpha = 0.25, data = dftags4) +
  ggplot2::geom_line(size = 2.5, data = dftags4 %>% filter(tag %in% names(colors)[colors != "gray"])) +
  ggplot2::geom_point(size = 4, alpha = 0.25, data = dftags4) +
  ggplot2::geom_point(size = 4, data = dftags4 %>% filter(tag %in% names(colors)[colors != "gray"])) +
  ggplot2::geom_point(size = 1.75, color = "white", data = dftags4) +
  ggplot2::geom_text(data = dftags5, ggplot2::aes(label = tag), hjust = -0, size = 4.5) +
  ggplot2::geom_text(data = dftags6, ggplot2::aes(label = tag), hjust = 1, size = 4.5) +
  ggplot2::scale_color_manual(values = colors) +
  ggplot2::ggtitle("The subway-style-rank-year-tag plot:\nPast and the Future") +
  ggplot2::xlab("Top Tags by Year in Stackoverflow") +
  ggplot2::scale_x_continuous(breaks = seq(min(dftags4$creation_year) - 2,
                                 max(dftags4$creation_year) + 2),
                     limits = c(min(dftags4$creation_year) - 1.0,
                                max(dftags4$creation_year) + 0.5))

p

# Trend

tags_tags <- dftags4 %>%
  count(tag) %>%
  filter(n >= 3) %>% # have at least 3 appearances
  filter(tag %in% dftags5$tag) %>% # top tags in 2015
  .$tag

dflms <- dftags4 %>%
  filter(tag %in% tags_tags) %>%
  group_by(tag) %>%
  do(model = lm(as.numeric(rank) ~ creation_year, data = .)) %>%
  mutate(slope = coefficients(model)[2]) %>%
  arrange(slope) %>%
  select(-model) %>%
  mutate(trend = cut(slope, breaks = c(-Inf, -1, 1, Inf), labels = c("-", "=", "+")),
         slope = round(slope, 2)) %>%
  arrange(desc(slope))

dflms %>% filter(trend != "=")

# Plot the aja. matrix

suppressPackageStartupMessages(library("igraph"))

dftags20140 <- dftags2 %>%
  filter(creation_year == "2014") %>%
  select(id, tag)

dfedge <- dftags20140 %>%
  left_join(dftags20140 %>% select(tag2 = tag, id), by = "id") %>%
  filter(tag < tag2) %>%
  count(tag, tag2) %>%
  ungroup() %>%
  arrange(desc(n)) %>%
  collect()

dfvert <- dftags20140 %>%
  group_by(tag) %>%
  summarise(n = n()) %>%
  ungroup() %>%
  arrange(desc(n)) %>%
  collect()

first_n <- 75

nodes <- dfvert %>%
  head(first_n) %>%
  mutate(id = seq(nrow(.))) %>%
  rename(label = tag) %>%
  select(id, label, n)

head(nodes)

edges <- dfedge %>%
  filter(tag %in% nodes$label, tag2 %in% nodes$label) %>%
  rename(from = tag, to = tag2)

head(edges)

g <- graph.data.frame(edges %>% rename(weight = n), directed = FALSE)
pr <- page.rank(g)$vector
c <- cluster_resolution(g, directed = FALSE)
V(g)$comm <- membership(c)

nodes <- nodes %>%
  left_join(data_frame(label = names(membership(c)),
                       cluster = as.character(membership(c))),
            by = "label") %>% 
  left_join(data_frame(label = names(pr), page_rank = pr),
            by = "label")

clusters <- nodes %>% 
  arrange(desc(page_rank)) %>% 
  group_by(cluster) %>% 
  do({data_frame(top_tags = paste(head(.$label), collapse = ", "))}) %>%
  ungroup() %>% 
  left_join(nodes %>% 
              group_by(cluster) %>% 
              arrange(desc(n)) %>% 
              summarise(n_tags = n(), n_qst = sum(n)) %>%
              ungroup(),
            by = "cluster") %>% 
  arrange(desc(n_qst))

clusters

clusters <- clusters %>% 
     mutate(cluster_name = c("web-frontend", "java & android", "general-programming-rocks",
                             ".net", "php-backend", "apple", "ror",
                             "excel-related"),
            cluster_name = factor(cluster_name, levels = rev(cluster_name)))

ggplot(clusters) +
  geom_bar(aes(cluster_name, n_qst),
           stat = "identity", width = 0.5, fill = "#198ce7") +
  scale_y_continuous("Questions", labels = scales::comma) + 
  xlab(NULL) +
  coord_flip() +
  ggtitle("Distrution for the number of Questions\nin the Top 100 tag Clusters")

nodes <- nodes %>% 
  mutate(nn2 = round(30*page_rank ^ 2/max(page_rank ^ 2)) + 1) %>% 
  left_join(clusters %>% select(cluster, cluster_name),
            by = "cluster") %>% 
  mutate(cluster_order = seq(nrow(.)))

edges2 <- edges %>% 
  left_join(nodes %>% select(from = label, id), by = "from") %>% 
  rename(source = id) %>%
  left_join(nodes %>% select(to = label, id), by = "to") %>% 
  rename(target = id) %>% 
  mutate(ne2 = round(30*n ^ 3/max(n ^ 3)) + 1,
         source = source - 1,
         target = target - 1) %>% 
  arrange(desc(n)) %>% 
  head(nrow(nodes)*1.5) # this is to reduce the edges to plot

colorrange <- viridisLite::viridis(nrow(clusters)) %>% 
  stringr::str_sub(1, 7) %>% 
  paste0("'", ., "'", collapse = ", ") %>% 
  paste0("[", ., "]")

colordomain <- clusters$cluster_name %>% 
  paste0("'", ., "'", collapse = ", ") %>% 
  paste0("[", ., "]")

color_scale <- "d3.scale.ordinal().domain(%s).range(%s)" %>% 
  sprintf(colordomain, colorrange)

net <- forceNetwork(Links = edges2, Nodes = nodes,
                    Source = "source", Target = "target",
                    NodeID = "label", Group = "cluster_name",
                    Value = "ne2", linkWidth = JS("function(d) { return Math.sqrt(d.value);}"),
                    Nodesize = "nn2", radiusCalculation = JS("Math.sqrt(d.nodesize)+6"),
                    colourScale = color_scale,
                    opacity = 1, linkColour = "#BBB", legend = TRUE,
                    linkDistance = 50, charge = -100, bounded = TRUE,
                    fontFamily = "Lato")

net

detach("package:dplyr", unload=TRUE)
library("plyr")
library("dplyr")
library("ggplot2")
library("beyonce")
library("data.table")

name_order <- (nodes %>% arrange(desc(cluster_name), desc(page_rank)))$label

# Remove the rbind line
edges2 <- edges %>% 
    inner_join(nodes %>% select(label, cluster_name), by = c("from" = "label")) %>% 
    inner_join(nodes %>% select(label, cluster_name), by = c("to" = "label")) %>% 
    purrr::map_if(is.factor, as.character) %>% 
    {rbind(., setnames(data.frame(., stringsAsFactors=FALSE), old=c("from", "to"), new=c("to", "from")))} %>% 
          plyr::mutate(group = ifelse(cluster_name.x == cluster_name.y, cluster_name.x, NA),
          group = factor(group, levels = clusters$cluster_name),
          to = factor(to, levels = rev(name_order)),
          from = factor(from, levels = name_order))

p2 <- ggplot(edges2, aes(x = from, y = to, fill = group, alpha = log(n))) +
  geom_tile() +
  scale_alpha_continuous(range = c(.0, 1)) + 
  scale_fill_manual(values = c(setNames(beyonce_palette(18 ,nrow(clusters), type = "continuous"),
                                        clusters$cluster_name)),
                    na.value = "gray") + 
  scale_x_discrete(drop = FALSE) +
  scale_y_discrete(drop = FALSE) +
  coord_equal() + 
  theme(axis.text.x = element_text(angle = 270, hjust = 0, vjust = 0),
        panel.grid.major = element_blank(),
        panel.grid.minor = element_blank(),
        panel.border = element_blank(),
        legend.position = "right") +
  xlab("Tags") + ylab("Same tags") +
  ggtitle("A tag-tag-cluster plot")
