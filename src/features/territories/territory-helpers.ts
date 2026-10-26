import type { TerritoryNode } from "@/lib/api";

export function typeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/** Districts are the second level of the tree (province → district). */
function listDistricts(tree: TerritoryNode[]): TerritoryNode[] {
  return tree.flatMap((province) =>
    province.children.filter((child) => child.type === "district"),
  );
}

export function getDistrictStats(tree: TerritoryNode[]) {
  const districts = listDistricts(tree);
  const assigned = districts.filter((item) => item.tcUserId).length;
  return {
    provinces: tree.length,
    districts: districts.length,
    assigned,
    unassigned: districts.length - assigned,
  };
}

/** First district when available, otherwise the first top-level node. */
export function getDefaultTerritoryId(tree: TerritoryNode[]): string | undefined {
  return listDistricts(tree)[0]?.id ?? tree[0]?.id;
}
