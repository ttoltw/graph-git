import { genMultiSort } from "@g/utils";
import { GitLog, GitRef } from "./types";

const typeOrder = ["", "branch", "remote", "tag", "stash", "commit", "other"];

const sortRefFn = genMultiSort<GitRef>(
  (a, b) => a.order - b.order, // sort by type_order
  (a, b) => a.name.localeCompare(b.name), // sort by name desc
);

export function parseGitLog(line: string): GitLog {
  const match = /^(\S+)\|([^|]+)?\|([^|]+)?\|(\S+)?\|([^|]+)?\|(.+)?$/.exec(line);
  if (!match) return null;
  const [, hash, parents, ref, date, author, subject] = match;
  const refs = ref
    ?.split(",")
    .map((ref) => ref.trim())
    .filter((ref) => ref);

  return {
    hash,
    parents: parents
      ?.split(/\s+/)
      .map((parent) => parent.trim())
      .filter((parent) => parent),
    refs: refs?.map((ref) => parseGitRef(hash, ref)).sort(sortRefFn),
    date,
    author,
    subject,
  };
}

export function parseGitRef(hash: string, ref: string): GitRef {
  if (!ref) return { hash, name: hash.substring(0, 7), type: "commit", fullname: hash, order: 999 };
  const [, head, prefix, name] =
    /^(?:(HEAD ->)|(?:tag:))?\s*refs\/(remotes|heads|tags|stash)(?:\/(.*))?$/.exec(ref) || [];
  if (!prefix) return { hash, name: ref, type: "other", fullname: ref, order: 999 };
  let type = "other";
  let remote: false | string = false;
  switch (prefix) {
    case "remotes":
      type = "remote";
      remote = name.split("/")[0];
      break;
    case "heads":
      type = "branch";
      break;
    case "tags":
      type = "tag";
      break;
    case "stash":
      type = "stash";
      break;
  }

  return {
    hash,
    name: name || ref,
    type,
    remote,
    current: !!head,
    fullname: ref,
    order: typeOrder.indexOf(type) || 999,
  };
}
