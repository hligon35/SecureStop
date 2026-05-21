const mockClear = jest.fn().mockResolvedValue(undefined);
const mockLoad = jest.fn();
const mockSave = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/tenancy/localMembershipRepository", () => ({
  localTenantMembershipRepository: {
    clear: mockClear,
    load: mockLoad,
    save: mockSave,
  },
}));

const { useTenantMembershipStore } =
  require("@/store/tenantMembership") as typeof import("@/store/tenantMembership");

describe("useTenantMembershipStore", () => {
  const initialState = useTenantMembershipStore.getState();

  beforeEach(() => {
    jest.clearAllMocks();
    useTenantMembershipStore.setState(initialState);
    mockLoad.mockResolvedValue(undefined);
    mockSave.mockResolvedValue(undefined);
    mockClear.mockResolvedValue(undefined);
  });

  it("hydrates persisted tenant membership context", async () => {
    mockLoad.mockResolvedValue({
      activeTenantId: " tenant-42 ",
      memberships: [
        {
          role: "driver",
          status: "active",
          tenantId: "tenant-42",
        },
      ],
    });

    await useTenantMembershipStore.getState().hydrate();

    expect(mockLoad).toHaveBeenCalledTimes(1);
    expect(useTenantMembershipStore.getState()).toMatchObject({
      activeTenantId: "tenant-42",
      hydrated: true,
      memberships: [
        {
          role: "driver",
          status: "active",
          tenantId: "tenant-42",
        },
      ],
    });
  });

  it("replaces and persists normalized context", () => {
    useTenantMembershipStore.getState().replaceContext({
      activeTenantId: " school-7 ",
      memberships: [
        {
          label: "School 7",
          role: "parent",
          status: "active",
          tenantId: "school-7",
        },
      ],
    });

    expect(mockSave).toHaveBeenCalledWith({
      activeTenantId: "school-7",
      memberships: [
        {
          label: "School 7",
          role: "parent",
          status: "active",
          tenantId: "school-7",
        },
      ],
    });
    expect(useTenantMembershipStore.getState()).toMatchObject({
      activeTenantId: "school-7",
      hydrated: true,
    });
  });

  it("syncs auth profile membership without duplicating the tenant", () => {
    useTenantMembershipStore.setState({
      activeTenantId: "tenant-1",
      hydrated: true,
      memberships: [
        {
          label: "Old Label",
          role: "parent",
          status: "active",
          tenantId: "tenant-1",
        },
        {
          role: "driver",
          status: "active",
          tenantId: "tenant-2",
        },
      ],
    });

    useTenantMembershipStore.getState().syncFromAuthProfile({
      label: "District 1",
      role: "admin",
      tenantId: " tenant-1 ",
    });

    expect(mockSave).toHaveBeenCalledWith({
      activeTenantId: "tenant-1",
      memberships: [
        {
          label: "District 1",
          role: "admin",
          status: "active",
          tenantId: "tenant-1",
        },
        {
          role: "driver",
          status: "active",
          tenantId: "tenant-2",
        },
      ],
    });
    expect(useTenantMembershipStore.getState().memberships).toEqual([
      {
        label: "District 1",
        role: "admin",
        status: "active",
        tenantId: "tenant-1",
      },
      {
        role: "driver",
        status: "active",
        tenantId: "tenant-2",
      },
    ]);
  });

  it("clears persisted tenant context", () => {
    useTenantMembershipStore.setState({
      activeTenantId: "tenant-9",
      hydrated: true,
      memberships: [
        {
          role: "parent",
          status: "active",
          tenantId: "tenant-9",
        },
      ],
    });

    useTenantMembershipStore.getState().clear();

    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(useTenantMembershipStore.getState()).toMatchObject({
      activeTenantId: "",
      memberships: [],
    });
  });
});
