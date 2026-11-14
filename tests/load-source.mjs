import {mkdir,readdir,readFile,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join,relative,dirname} from 'node:path';
import ts from 'typescript';
export async function loadSource(label){
  const src=fileURLToPath(new URL('../src/',import.meta.url));
  const root=fileURLToPath(new URL(`../.cache/tests-${label}-${process.pid}/`,import.meta.url));
  async function compile(dir){for(const item of await readdir(dir,{withFileTypes:true})){
    const path=join(dir,item.name);if(item.isDirectory())await compile(path);
    else if(item.name.endsWith('.ts')){const target=join(root,relative(src,path)).replace(/\.ts$/,'.mjs');await mkdir(dirname(target),{recursive:true});
      const source=await readFile(path,'utf8');const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/from (['"])(\.[^'"]+)\1/g,(_,q,p)=>`from ${q}${p}.mjs${q}`);
      await writeFile(target,output);
    }
  }}await compile(src);
  return {import:path=>import(pathToFileURL(join(root,path+'.mjs'))),cleanup:()=>rm(root,{recursive:true,force:true})};
}
