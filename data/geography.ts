import type { Territory } from "@/types";

export const TERRITORIES: Territory[] = [
  { id: "prov-kigali", name: "Kigali City", type: "province" },
  { id: "prov-south", name: "Southern Province", type: "province" },
  { id: "prov-east", name: "Eastern Province", type: "province" },
  { id: "prov-north", name: "Northern Province", type: "province" },
  { id: "prov-west", name: "Western Province", type: "province" },

  {
    id: "dist-gasabo",
    name: "Gasabo",
    type: "district",
    parentId: "prov-kigali",
    tcUserId: "user-tc-kigali",
  },
  {
    id: "dist-kicukiro",
    name: "Kicukiro",
    type: "district",
    parentId: "prov-kigali",
    tcUserId: "user-tc-kigali",
  },
  {
    id: "dist-nyarugenge",
    name: "Nyarugenge",
    type: "district",
    parentId: "prov-kigali",
    tcUserId: "user-tc-kigali",
  },
  {
    id: "dist-huye",
    name: "Huye",
    type: "district",
    parentId: "prov-south",
    tcUserId: "user-tc-south",
  },
  {
    id: "dist-muhanga",
    name: "Muhanga",
    type: "district",
    parentId: "prov-south",
    tcUserId: "user-tc-south",
  },
  {
    id: "dist-rwamagana",
    name: "Rwamagana",
    type: "district",
    parentId: "prov-east",
  },
  {
    id: "dist-musanze",
    name: "Musanze",
    type: "district",
    parentId: "prov-north",
  },
  {
    id: "dist-rubavu",
    name: "Rubavu",
    type: "district",
    parentId: "prov-west",
  },

  { id: "sec-remera", name: "Remera", type: "sector", parentId: "dist-gasabo" },
  { id: "sec-kimironko", name: "Kimironko", type: "sector", parentId: "dist-gasabo" },
  { id: "sec-kanombe", name: "Kanombe", type: "sector", parentId: "dist-kicukiro" },
  { id: "sec-gikondo", name: "Gikondo", type: "sector", parentId: "dist-kicukiro" },
  { id: "sec-nyamirambo", name: "Nyamirambo", type: "sector", parentId: "dist-nyarugenge" },
  { id: "sec-ngoma", name: "Ngoma", type: "sector", parentId: "dist-huye" },
  { id: "sec-nyamabuye", name: "Nyamabuye", type: "sector", parentId: "dist-muhanga" },
];
