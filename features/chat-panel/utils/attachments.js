async function serializeAttachments(fileList) {
  const attachments = [];
  for (const file of fileList) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(
        new Error(`\u65E0\u6CD5\u8BFB\u53D6\u9644\u4EF6\u300C${file.name}\u300D\uFF0C\u8BF7\u91CD\u8BD5\u6216\u66F4\u6362\u7D20\u6750\u3002`)
      );
      reader.readAsDataURL(file);
    });
    attachments.push({
      url: dataUrl,
      mediaType: file.type
    });
  }
  return attachments;
}
export {
  serializeAttachments
};
