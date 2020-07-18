import katex from "katex";
import getRemByID from "../api/getRemByID";
import nthOccurrence from "./nthOccurence";
import { stripHtml } from "./dom";
import dedupeArr from "./dedupeArr";
// import getIsLocal from "../utils/isLocal";

const globalSlotRems = [];
const contentRems = [];

async function getName(name, visibleRems = [], remId, isWithAnchor) {
  if (Array.isArray(name)) {
    const names = await Promise.all(
      name
        .filter(
          (n) =>
            typeof n === "string" || n.i === "q" || n.i === "i" || n.i === "m"
        )
        .map(async (r) => {
          if (typeof r === "string") {
            return r;
          }

          if (r.i === "m") {
            if (r.x === true) {
              const latexString = katex.renderToString(r.text, {
                throwOnError: false,
              });
              return latexString;
            }
            return r.text;
          }

          if (r.i === "i") {
            return `<img src=${r.url} width=${r.width} height={r.height} />`;
          }

          const existingRem = [...globalSlotRems, ...visibleRems].find(
            (o) => o._id === r._id
          );
          if (existingRem) {
            return {
              remId: existingRem._id,
              name: existingRem.name,
            };
          }
          const a = await getRemByID(r._id);
          globalSlotRems.push(a);
          return {
            remId: a._id,
            name: a.name,
          };
        })
    );

    const innerNames = await Promise.all(
      names.map(async (r) => {
        if (typeof r === "string") {
          return r;
        }
        return isWithAnchor
          ? `<a href="#" data-source="${remId}" data-target="${
              r.remId
            }" onclick="handleFocus(this)">${await getName(
              r.name,
              visibleRems,
              undefined,
              false
            )}</a>`
          : getName(r.name, visibleRems, undefined, false);
      })
    );

    return innerNames.join("");
  }
  return "";
}

async function getContent(content, visibleRems = [], remId, isWithAnchor) {
  if (Array.isArray(content)) {
    const nest = await Promise.all(
      content
        .filter(
          (n) =>
            typeof n === "string" || n.i === "q" || n.i === "i" || n.i === "m"
        )
        .map(async (r) => {
          if (typeof r === "string") {
            return r;
          }

          if (r.i === "m") {
            if (r.x === true) {
              const latexString = katex.renderToString(r.text, {
                throwOnError: false,
              });
              return latexString;
            }
            return r.text;
          }

          if (r.i === "i") {
            return `<img src=${r.url} width=${r.width} height={r.height} />`;
          }

          const existingRem = [...contentRems, ...visibleRems].find(
            (o) => o._id === r._id
          );
          if (existingRem) {
            return {
              remId: existingRem._id,
              name: existingRem.name,
            };
          }
          const a = await getRemByID(r._id);
          contentRems.push(a);
          return {
            remId: existingRem._id,
            name: existingRem.name,
          };
        })
    );

    const innerContent = await Promise.all(
      nest.map(async (r) => {
        if (typeof r === "string") {
          return r;
        }
        if (r.i === "m") {
          return r.text;
        }
        return isWithAnchor
          ? `<a href="#" data-source="${remId}" data-target="${
              r.remId
            }" onclick="handleFocus(this)">${await getName(
              r.name,
              visibleRems,
              undefined,
              false
            )}</a>`
          : getName(r.name, visibleRems, undefined, false);
      })
    );

    return innerContent.join("");
  }
  return "";
}

async function bootstrapData(remId) {
  const context = await window.RemNoteAPI.v0.get_context();

  const documentRem = await window.RemNoteAPI.v0.get(context.documentId);
  const visibleRems = (
    await Promise.all(
      documentRem.visibleRemOnDocument.map((id) => getRemByID(id))
    )
  ).filter((e) => e.found);

  visibleRems.push(documentRem);

  const nameWithAnchor = await Promise.all(
    visibleRems.map((v) => getName(v.name, visibleRems, v._id, true))
  );
  const nameText = nameWithAnchor.map((e) =>
    stripHtml(e)
      .split(" ")
      .map((item, idx) => (idx % 2 === 0 ? item : item + "\n")) // add line break to every second word
      .join(" ")
  );
  const content = await Promise.all(
    visibleRems.map((v) => getContent(v.content, visibleRems, v._id, true))
  );

  const graphElements = visibleRems
    .map((v, index) => {
      const title = nameText[index];
      const fifthBreakIndex = nthOccurrence(title, " ", 15);
      const processedTitle =
        fifthBreakIndex >= 0 ? `${title.substr(0, fifthBreakIndex)}...` : title;
      return {
        data: {
          id: v._id,
          title: processedTitle,
          fullTitle: nameWithAnchor[index],
          content: content[index],
          nodeColor: v.isDocument ? "yellow" : "red",
        },
      };
    })
    .filter((v) => v.data && v.data.title);

  visibleRems.forEach((v) => {
    if (v.children.length > 0) {
      graphElements.push(
        ...v.children.map((c) => ({
          data: {
            source: v._id,
            target: c,
            target_arrow_shape: "diamond",
          },
        }))
      );
    }

    if (Array.isArray(v.content)) {
      graphElements.push(
        ...v.content
          .filter((c) => c.i === "q")
          .map((c) => ({
            data: {
              source: v._id,
              target: c._id,
              target_arrow_shape: "vee",
            },
          }))
      );
    }

    if (Array.isArray(v.name)) {
      graphElements.push(
        ...v.name
          .filter((c) => c.i === "q")
          .map((c) => ({
            data: {
              source: v._id,
              target: c._id,
              target_arrow_shape: "vee",
            },
          }))
      );
    }
  });
  return dedupeArr(graphElements);
}

export default bootstrapData;
