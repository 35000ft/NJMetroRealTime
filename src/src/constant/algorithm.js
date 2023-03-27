export function dijkstra(graph, startNode, endNode) {
    // 初始化距离和前驱节点
    const distances = {}
    const predecessors = {}
    for (let node in graph) {
        distances[node] = Infinity
        predecessors[node] = null
    }
    distances[startNode] = 0
    // 创建一个未处理节点的队列
    const unvisitedNodes = Object.keys(graph)
    // 找到当前距离最短的节点
    while (unvisitedNodes.length > 0) {
        let currentNode = unvisitedNodes.reduce((minNode, node) => {
            return distances[node] < distances[minNode] ? node : minNode
        }, unvisitedNodes[0])
        // 如果到达终点，则返回最短路径
        if (currentNode === endNode) {
            let path = []
            while (currentNode !== startNode) {
                path.unshift(currentNode)
                currentNode = predecessors[currentNode]
            }
            path.unshift(startNode)
            return {
                distance: distances[endNode],
                path: path
            }
        }
        // 更新当前节点相邻节点的距离
        unvisitedNodes.splice(unvisitedNodes.indexOf(currentNode), 1)
        for (let neighbor in graph[currentNode]) {
            let distance = graph[currentNode][neighbor]
            let totalDistance = distances[currentNode] + distance
            if (totalDistance < distances[neighbor]) {
                distances[neighbor] = totalDistance
                predecessors[neighbor] = currentNode
            }
        }
    }
    // 如果无法到达终点，则返回空路径
    return {
        distance: Infinity,
        path: []
    }
}