async function requestPptBlueprint({
  brief,
  modelRuntime
}) {
  const response = await fetch("/api/ppt/blueprint", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      brief,
      modelRuntime
    })
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      errorText || "\u751F\u6210 PPT \u9AA8\u67B6\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u6A21\u578B\u914D\u7F6E\u6216\u7A0D\u540E\u518D\u8BD5\u3002"
    );
  }
  const data = await response.json();
  if (!data?.blueprint) {
    throw new Error("\u672A\u8FD4\u56DE\u6709\u6548\u7684 PPT \u9AA8\u67B6\uFF0C\u8BF7\u91CD\u8BD5\u3002");
  }
  return data.blueprint;
}
async function requestSlideRender(payload) {
  const response = await fetch("/api/ppt/render-slide", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      errorText || "\u751F\u6210\u5E7B\u706F\u7247\u5185\u5BB9\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u6216\u66F4\u6362\u6A21\u578B\u3002"
    );
  }
  const data = await response.json();
  if (!data?.result) {
    throw new Error("\u6A21\u578B\u672A\u8FD4\u56DE\u53EF\u7528\u7684\u5E7B\u706F\u7247 XML\u3002");
  }
  return data.result;
}
export {
  requestPptBlueprint,
  requestSlideRender
};
