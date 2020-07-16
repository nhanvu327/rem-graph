import getRemByID from "../api/getRemByID";
import nthOccurrence from "./nthOccurence";
import { stripHtml } from "./dom";
// import getIsLocal from "../utils/isLocal";

const globalSlotRems = [];
const contentRems = [];

const isLocal = false;

async function getName(name, visibleRems = [], remId, isWithAnchor) {
  if (Array.isArray(name)) {
    const names = await Promise.all(
      name
        .filter((n) => typeof n === "string" || !!n._id)
        .map(async (r) => {
          if (typeof r === "string") {
            return r;
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
        .filter((n) => typeof n === "string" || !!n._id)
        .map(async (r) => {
          if (typeof r === "string") {
            return r;
          }

          if (r.i === "m") {
            return r.text;
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
  const context = isLocal ?  undefined : await window.RemNoteAPI.v0.get_context();

  const documentRem = isLocal
    ? await getRemByID(remId)
    : await window.RemNoteAPI.v0.get(context.documentId);
  const visibleRems = (
    await Promise.all(
      documentRem.visibleRemOnDocument.map((id) => getRemByID(id))
    )
  ).filter((e) => e.found);

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

  visibleRems.push(...contentRems);

  const graphElements = visibleRems
    .map((v, index) => {
      const title = nameText[index];
      const fifthBreakIndex = nthOccurrence(title, " ", 10);
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
    .filter((v) => v.data.title);

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
          .filter((c) => typeof c !== "string")
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
          .filter(
            (c) =>
              typeof c !== "string" &&
              !graphElements.some((g) => g.data.target === c._id)
          )
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
  return graphElements;
}

export default bootstrapData;
