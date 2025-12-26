async function serializeAttachments(fileList) {
  const attachments = [];
  for (const file of fileList) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // 将文件名编码到 DataURL 中，确保即使其他字段丢失也能提取
        // 格式：data:mime/type;filename=encodedName;base64,data
        const baseDataUrl = reader.result;
        // 如果 DataURL 还没有包含文件名，添加它
        if (!baseDataUrl.includes('filename=')) {
          const encodedFileName = encodeURIComponent(file.name);
          const mimeMatch = baseDataUrl.match(/^data:([^;]+)/);
          if (mimeMatch) {
            const mimeType = mimeMatch[1];
            const base64Data = baseDataUrl.substring(baseDataUrl.indexOf(',') + 1);
            resolve(`data:${mimeType};filename=${encodedFileName};base64,${base64Data}`);
          } else {
            resolve(baseDataUrl);
          }
        } else {
          resolve(baseDataUrl);
        }
      };
      reader.onerror = () => reject(
        new Error(`无法读取附件「${file.name}」，请重试或更换素材。`)
      );
      reader.readAsDataURL(file);
    });
    attachments.push({
      url: dataUrl,
      mediaType: file.type,
      fileName: file.name // 添加文件名
    });
  }
  return attachments;
}
export {
  serializeAttachments
};
