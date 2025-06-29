export type LogOptions = {
  maxCount?: number;
  skip?: number;
  all?: boolean;
  branches?: boolean;
  tags?: boolean;
  remotes?: boolean;
  simplify?: boolean;
};

export type GitLog = {
  hash: string;
  parents?: string[];
  refs?: GitRef[];
  date?: string;
  author?: string;
  subject?: string;
};

export type GitRef = {
  name: string;
  hash: string;
  type: "tag" | "branch" | "stash" | "remote" | "head" | "commit" | "other" | string;
  remote?: false | string;
  current?: boolean;
  fullname?: string;
  order?: number;
};
