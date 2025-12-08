async function serializeAttachments(fileList) {
  const attachments = [];
  for (const file of fileList) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(
        new Error(`无法读取附件「${file.name}」，请重试或更换素材。`)
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
