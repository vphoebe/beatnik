import { Platform } from "youtubei.js";

Platform.shim.eval = async (data, env) => {
  const properties = [];

  if (env.n) properties.push(`n: exportedVars.nFunction("${env.n}")`);

  if (env.sig) properties.push(`sig: exportedVars.sigFunction("${env.sig}")`);

  const code = `${data.output}\nreturn { ${properties.join(", ")} }`;

  return new Function(code)();
};
