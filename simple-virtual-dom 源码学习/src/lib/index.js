import createElement from "./src/lib/element";

var tree = createElement("div", { id: "container" }, [
  createElement("h1", { style: "color: blue" }, ["simple virtal dom"]),
  createElement("p", ["Hello, virtual-dom"]),
  createElement("ul", [createElement("li")])
]);
console.log(tree, "tree");
// 2. 生成真正的 dom
// var root = tree.render();
