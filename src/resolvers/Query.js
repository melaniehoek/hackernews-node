async function feed(parent, { filter, skip, first, orderBy }, context, info) {
  const where = filter
    ? {
        OR: [{ description_contains: filter }, { url_contains: filter }],
      }
    : {};
  const links = await context.prisma.links({ where, skip, first, orderBy });
  const count = await context.prisma
    .linksConnection({ where })
    .aggregate()
    .count();

  return {
    links,
    count,
  };
}

module.exports = {
  feed,
};
