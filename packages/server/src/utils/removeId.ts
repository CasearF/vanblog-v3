export function removeID(objArr: any[]) {
  if (!objArr) {
    return null;
  }
  return objArr.map((each) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, __v, ...rest } = each;
    return rest;
  });
}
