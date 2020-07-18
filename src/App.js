import React, { useEffect } from "react";
import cytoscape from "cytoscape";
import popper from "cytoscape-popper";
import coseBilkent from "cytoscape-cose-bilkent";
import tippy, { sticky } from "tippy.js";
import "tippy.js/dist/tippy.css";
import getGraphElements from "./utils/buildData";
import { convertStringToHtml } from "./utils/dom";

window.handleFocus = function handleFocus(element) {
  const cy = window.cy;
  cy.fit(cy.$(`#${element.dataset.source}, #${element.dataset.target}`), 100);
};

function makePopper(ele) {
  const ref = ele.popperRef();
  const dummyDomEle = document.createElement("div");
  ele.tippy = tippy(dummyDomEle, {
    onCreate: function (instance) {
      instance.popperInstance.reference = ref;
    },
    lazy: false, // mandatory
    plugins: [sticky],
    content: () => {
      const contentdiv = document.createElement("div");
      const { fullTitle, content } = ele.data();
      const titleEl = document.createElement("h3");
      titleEl.appendChild(convertStringToHtml(fullTitle));
      contentdiv.appendChild(titleEl);

      if (content) {
        const contentEl = document.createElement("div");
        contentEl.appendChild(convertStringToHtml(content));
        contentdiv.appendChild(contentEl);
      }

      return contentdiv;
    },
    arrow: true,
    placement: "bottom",
    hideOnClick: false,
    multiple: true,
    // if interactive:
    interactive: true,
    sticky: true,
    appendTo: document.body, // or append dummyDomEle to document.body
    trigger: "manual", //when use program to handle
  });
}

export default function Home() {
  useEffect(() => {
    async function bootstrapData() {
      const graphElements = await getGraphElements("GH5MRkMCJ6R6aoLbB");
      const filteredGraphElements = graphElements.filter((i) =>
        i.data.title
          ? true
          : graphElements.some((s) => s.data.id === i.data.source) &&
            graphElements.some((s) => s.data.id === i.data.target)
      );
      cytoscape.use(coseBilkent);
      cytoscape.use(popper);
      const cy = cytoscape({
        container: document.getElementById("cy"),
        elements: filteredGraphElements,
        style: [
          {
            selector: "node",
            style: {
              "background-color": "data(nodeColor)",
              label: "data(title)",
              color: " #66ff66",
              "font-size": "10px",
              "text-wrap": "wrap",
              "text-overflow-wrap": "anywhere",
            },
          },
          {
            selector: "node[[degree = 0]]",
            style: {
              width: 8,
              height: 8,
            },
          },
          {
            selector: "node[[degree >= 1]][[degree <= 3]]",
            style: {
              width: 10,
              height: 10,
            },
          },
          {
            selector: "node[[degree > 3]][[degree <= 5]]",
            style: {
              width: 12,
              height: 12,
            },
          },
          {
            selector: "node[[degree > 5]][[degree <= 7]]",
            style: {
              width: 14,
              height: 14,
            },
          },
          {
            selector: "node[[degree > 7]][[degree <= 9]]",
            style: {
              width: 16,
              height: 16,
            },
          },
          {
            selector: "node[[degree > 9]]",
            style: {
              width: 18,
              height: 18,
            },
          },
          {
            selector: "edge",
            style: {
              width: 1,
              "line-color": "#ccc",
              "target-arrow-color": "#ccc",
              "target-arrow-shape": "data(target_arrow_shape)",
              "curve-style": "bezier",
              "arrow-scale": 1,
              label: "data(label)",
              color: "green",
              "font-size": "7px",
              "text-wrap": "wrap",
            },
          },
          {
            selector: "node.highlight",
            style: {
              "border-color": "#FFF",
              "border-width": "1px",
            },
          },
          {
            selector: "node.semitransp",
            style: { opacity: "0.2" },
          },
          {
            selector: "edge.highlight",
            style: { "mid-target-arrow-color": "#FFF" },
          },
          {
            selector: "edge.semitransp",
            style: { opacity: "0.2" },
          },
        ],
        layout: {
          name: "cose-bilkent",
          quality: "default",
          // Whether to include labels in node dimensions. Useful for avoiding label overlap
          nodeDimensionsIncludeLabels: true,
          fit: true,
          // Padding on fit
          padding: 10,
          // Whether to enable incremental mode
          randomize: true,
          // Node repulsion (non overlapping) multiplier
          nodeRepulsion: 20000,
          // Ideal (intra-graph) edge length
          idealEdgeLength: 70,
          // Divisor to compute edge forces
          edgeElasticity: 0.45,
          // Nesting factor (multiplier) to compute ideal edge length for inter-graph edges
          nestingFactor: 0.1,
          // Gravity force (constant)
          gravity: 0.25,
          // Maximum number of iterations to perform
          numIter: 2500,
          // Whether to tile disconnected nodes
          tile: true,
          // Type of layout animation. The option set is {'during', 'end', false}
          animate: "end",
          // Duration for animate:end
          animationDuration: 500,
          // Amount of vertical space to put between degree zero nodes during tiling (can also be a function)
          tilingPaddingVertical: 10,
          // Amount of horizontal space to put between degree zero nodes during tiling (can also be a function)
          tilingPaddingHorizontal: 10,
          // Gravity range (constant) for compounds
          gravityRangeCompound: 1.5,
          // Gravity force (constant) for compounds
          gravityCompound: 1.0,
          // Gravity range (constant)
          gravityRange: 3.8,
          // Initial cooling factor for incremental layout
          initialEnergyOnIncremental: 0.5,
        },
      });

      cy.ready(function () {
        window.cy = cy;
        cy.elements().forEach(function (ele) {
          if (ele.isNode()) {
            makePopper(ele);
            ele.unbind("select");
            ele.bind("select", (event) => event.target.tippy.show());

            ele.unbind("unselect");
            ele.bind("unselect", (event) => event.target.tippy.hide());
          }
        });

        cy.on("mouseover", "node", function (e) {
          var sel = e.target;
          cy.elements()
            .difference(sel.outgoers().union(sel.incomers()))
            .not(sel)
            .addClass("semitransp");
          sel
            .addClass("highlight")
            .outgoers()
            .union(sel.incomers())
            .addClass("highlight");
        });
        cy.on("mouseout", "node", function (e) {
          var sel = e.target;
          cy.elements().removeClass("semitransp");
          sel
            .removeClass("highlight")
            .outgoers()
            .union(sel.incomers())
            .removeClass("highlight");
        });
      });
    }
    bootstrapData();
  }, []);
  return (
    <div>
      <div id="cy" />
    </div>
  );
}
