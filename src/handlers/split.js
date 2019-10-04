module.exports = function splitHandler({ host }) {
  if (!host) {
    throw new Error('Need to specify a host for the split middleware.');
  }

  return async (ctx, next) => {
    const duplicateContext = ctx.clone();
    duplicateContext.cloned = true;

    duplicateContext.request = {
      ...duplicateContext.request,
      href: duplicateContext.request.href.replace(duplicateContext.request.href, host),
      host,
    };

    // eslint-disable-next-line no-undef
    ctx.event.waitUntil(next(duplicateContext));
    await next(ctx);
  };
};
