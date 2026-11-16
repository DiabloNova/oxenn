import { mkdtemp,mkdir,writeFile,rm,symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach,describe,expect,it } from "vitest";
import { loadApplicableInstructions } from "../../../../tools/development-agent/src/instruction-loader";

const temporaryRoots: string[] = [];
async function makeRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(),"oxenn-agent-instructions-"));
  temporaryRoots.push(root);
  return root;
}
afterEach(async () => { await Promise.all(temporaryRoots.splice(0).map((root) => rm(root,{recursive:true,force:true}))); });

describe("applicable instruction discovery",() => {
  it("includes ancestor instructions and the instruction tree inside an allowed directory",async () => {
    const root = await makeRoot();
    const scope = path.join(root,"src","features","billing");
    await mkdir(path.join(scope,"nested"),{recursive:true});
    await mkdir(path.join(root,"unrelated"),{recursive:true});
    for (const relative of ["AGENTS.md","src/AGENTS.md","src/features/AGENTS.md","src/features/billing/AGENTS.md","src/features/billing/nested/AGENTS.md","unrelated/AGENTS.md"]) {
      const target = path.join(root,relative);
      await mkdir(path.dirname(target),{recursive:true});
      await writeFile(target,"instructions: " + relative);
    }
    const loaded = await loadApplicableInstructions(root,["src/features/billing"]);
    const paths = loaded.files.map((file) => file.path);
    expect(paths).toEqual(expect.arrayContaining(["AGENTS.md","src/AGENTS.md","src/features/AGENTS.md","src/features/billing/AGENTS.md","src/features/billing/nested/AGENTS.md"]));
    expect(paths).not.toContain("unrelated/AGENTS.md");
    expect(loaded.rootInstructionFound).toBe(true);
    expect(loaded.discoveryLimitExceeded).toBe(false);
  });

  it("does not traverse sibling instruction trees for a file scope",async () => {
    const root = await makeRoot();
    await mkdir(path.join(root,"src","features","billing"),{recursive:true});
    for (const relative of ["AGENTS.md","src/AGENTS.md","src/features/AGENTS.md","src/features/billing/AGENTS.md"]) {
      const target = path.join(root,relative);
      await mkdir(path.dirname(target),{recursive:true});
      await writeFile(target,"instructions");
    }
    await writeFile(path.join(root,"src","features","billing.ts"),"export {};");
    const loaded = await loadApplicableInstructions(root,["src/features/billing.ts"]);
    expect(loaded.files.map((file) => file.path)).toEqual(expect.arrayContaining(["AGENTS.md","src/AGENTS.md","src/features/AGENTS.md"]));
    expect(loaded.files.map((file) => file.path)).not.toContain("src/features/billing/AGENTS.md");
  });

  it("fails closed when a nested directory scope contains an external directory symlink",async () => {
    const root = await makeRoot();
    const external = await makeRoot();
    await mkdir(path.join(root,"src"),{recursive:true});
    await mkdir(path.join(external,"private"),{recursive:true});
    await writeFile(path.join(external,"private","AGENTS.md"),"outside instructions");
    await symlink(path.join(external,"private"),path.join(root,"src","linked"),"dir");
    await expect(loadApplicableInstructions(root,["src"])).rejects.toThrow(/outside the repository/);
  });

  it("reports a bounded discovery limit instead of silently omitting deep instructions",async () => {
    const root = await makeRoot();
    let current = path.join(root,"scope");
    await mkdir(current,{recursive:true});
    for (let depth = 0; depth < 34; depth += 1) {
      await writeFile(path.join(current,"AGENTS.md"),"instructions " + depth);
      current = path.join(current,"nested");
      await mkdir(current,{recursive:true});
    }
    const loaded = await loadApplicableInstructions(root,["scope"]);
    expect(loaded.discoveryLimitExceeded).toBe(true);
  });
});
