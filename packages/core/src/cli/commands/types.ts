export type AliasType = "mo" | "co";
export type FullType = "module" | "controller";

export type Type = FullType | AliasType;

export interface GeneratorArguments {
    name?: string;
    resourceType?: Type;
}

export type ResourceTypeOptions = {
    value: Type;
    label: string;
};
