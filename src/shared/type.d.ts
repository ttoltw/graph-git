
declare type GitRef = {
    hash: string;
    parents?: string[];
    refs?: string[];
    name?: string;
    type?: "tag" | "branch" | "stash" | "other" | string;
    date?: string;
    author?: string;
    subject?: string;

}