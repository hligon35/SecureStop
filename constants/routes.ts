import type { Role } from "@/constants/roles";

export function roleRootPath(
  role: Role,
): `/(parent)/(tabs)/map` | `/(driver)/(tabs)/map` | `/(admin)/(tabs)/fleet` {
  switch (role) {
    case "parent":
      return "/(parent)/(tabs)/map";
    case "driver":
      return "/(driver)/(tabs)/map";
    case "admin":
      return "/(admin)/(tabs)/fleet";
  }
}

export function roleProfilePath(
  role: Role,
):
  | `/(parent)/(tabs)/setup`
  | `/(driver)/(tabs)/setup`
  | `/(admin)/(tabs)/settings` {
  switch (role) {
    case "parent":
      return "/(parent)/(tabs)/setup";
    case "driver":
      return "/(driver)/(tabs)/setup";
    case "admin":
      return "/(admin)/(tabs)/settings";
  }
}
