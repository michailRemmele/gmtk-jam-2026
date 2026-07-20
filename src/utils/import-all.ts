export const importAll = (context: __WebpackModuleApi.RequireContext): unknown[] => {
  const modules = context.keys().map(context);
  return modules.map((module) => (module as Record<string, unknown>).default);
};
