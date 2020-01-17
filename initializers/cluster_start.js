module.exports = function(cluster) {
  if (cluster.clusteringActive) cluster.init()
}
