export type Block = {
  id: string;
  type: "text";
  content: string;
};

export type Document = {
  id: string;
  title: string;
  blocks: Block[];
  updatedAt: number;
};