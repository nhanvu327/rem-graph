const dedupeArr = (arr) =>
  arr.reduce((acc, current) => {
    const x = current.data?.source
      ? acc.find(
          (item) =>
            item.data?.source === current.data?.source &&
            item.data?.target === current.data?.target &&
            item.data?.target_arrow_shape === current.data?.target_arrow_shape
        )
      : false;
    if (!x) {
      return acc.concat(current);
    } else {
      return acc;
    }
  }, []);

export default dedupeArr;
