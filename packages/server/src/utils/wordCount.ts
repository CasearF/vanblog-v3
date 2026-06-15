export function wordCount(Words: string) {
  let iTotal = 0;
  let eTotal = 0;
  for (let i = 0; i < Words.length; i++) {
    const c = Words.charAt(i);
    //基本汉字
    if (c.match(/[\u4e00-\u9fa5]/)) {
      iTotal++;
    }
    //基本汉字补充
    if (c.match(/[\u9FA6-\u9fcb]/)) {
      iTotal++;
    }
    //  中文标点加中文字、英文
    if (!c.match(/[^\x00-\xff]/)) {
      // 英文
      eTotal++;
    }
  }
  return iTotal + eTotal;
}
