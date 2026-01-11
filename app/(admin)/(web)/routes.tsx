import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, DataTable, Dialog, Portal, Switch, Text, TextInput } from 'react-native-paper';

import { useAdminRegistryStore } from '@/store/adminRegistry';
import { useAuthStore } from '@/store/auth';

export default function AdminWebRoutes() {
  const tenantId = useAuthStore((s) => s.schoolId);

  const hydrated = useAdminRegistryStore((s) => s.hydrated);
  const ensureTenant = useAdminRegistryStore((s) => s.ensureTenant);
  const reg = useAdminRegistryStore((s) => s.byTenant[tenantId]);
  const addRoute = useAdminRegistryStore((s) => s.addRoute);
  const updateRoute = useAdminRegistryStore((s) => s.updateRoute);
  const deleteRoute = useAdminRegistryStore((s) => s.deleteRoute);

  useEffect(() => {
    if (!tenantId) return;
    ensureTenant(tenantId);
  }, [ensureTenant, tenantId]);

  const routes = reg?.routes ?? [];
  const vehicles = reg?.vehicles ?? [];
  const drivers = reg?.drivers ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(() => routes.find((r) => r.id === editingId) ?? null, [editingId, routes]);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');

  function openCreate() {
    setEditingId(null);
    setId('');
    setName('');
    setActive(true);
    setVehicleId('');
    setDriverId('');
    setDialogOpen(true);
  }

  function openEdit(routeId: string) {
    const r = routes.find((x) => x.id === routeId);
    if (!r) return;
    setEditingId(routeId);
    setId(r.id);
    setName(r.name);
    setActive(r.active);
    setVehicleId(r.vehicleId ?? '');
    setDriverId(r.driverId ?? '');
    setDialogOpen(true);
  }

  function save() {
    if (!tenantId) return;
    const nextId = id.trim();
    const nextName = name.trim();
    if (!nextId || !nextName) return;

    const payload = {
      id: nextId,
      name: nextName,
      active,
      vehicleId: vehicleId.trim() || undefined,
      driverId: driverId.trim() || undefined,
    };

    if (editing) updateRoute(tenantId, editing.id, payload);
    else addRoute(tenantId, payload);

    setDialogOpen(false);
  }

  const vehicleLabel = useMemo(() => {
    const map = new Map(vehicles.map((v) => [v.id, v.label] as const));
    return (id: string | undefined) => (id ? map.get(id) ?? id : '—');
  }, [vehicles]);

  const driverLabel = useMemo(() => {
    const map = new Map(drivers.map((d) => [d.id, d.name] as const));
    return (id: string | undefined) => (id ? map.get(id) ?? id : '—');
  }, [drivers]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Routes" subtitle="Web" />
        <Card.Content>
          <Text variant="labelSmall" style={{ opacity: 0.7 }}>
            Tenant: {tenantId || '—'}
          </Text>
          <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>Route registry and assignments</Text>
            <Button mode="contained" onPress={openCreate} disabled={!hydrated || !tenantId}>
              Add route
            </Button>
          </View>

          <DataTable style={{ marginTop: 12 }}>
            <DataTable.Header>
              <DataTable.Title>ID</DataTable.Title>
              <DataTable.Title>Name</DataTable.Title>
              <DataTable.Title>Active</DataTable.Title>
              <DataTable.Title>Vehicle</DataTable.Title>
              <DataTable.Title>Driver</DataTable.Title>
              <DataTable.Title numeric>Actions</DataTable.Title>
            </DataTable.Header>

            {routes.map((r) => (
              <DataTable.Row key={r.id}>
                <DataTable.Cell>{r.id}</DataTable.Cell>
                <DataTable.Cell>{r.name}</DataTable.Cell>
                <DataTable.Cell>{r.active ? 'Yes' : 'No'}</DataTable.Cell>
                <DataTable.Cell>{vehicleLabel(r.vehicleId)}</DataTable.Cell>
                <DataTable.Cell>{driverLabel(r.driverId)}</DataTable.Cell>
                <DataTable.Cell numeric>
                  <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                    <Button compact mode="outlined" onPress={() => openEdit(r.id)}>
                      Edit
                    </Button>
                    <Button
                      compact
                      mode="text"
                      onPress={() => {
                        if (!tenantId) return;
                        deleteRoute(tenantId, r.id);
                      }}
                    >
                      Remove
                    </Button>
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            ))}

            {routes.length === 0 ? (
              <DataTable.Row>
                <DataTable.Cell>—</DataTable.Cell>
                <DataTable.Cell>—</DataTable.Cell>
                <DataTable.Cell>—</DataTable.Cell>
                <DataTable.Cell>—</DataTable.Cell>
                <DataTable.Cell>—</DataTable.Cell>
                <DataTable.Cell numeric>—</DataTable.Cell>
              </DataTable.Row>
            ) : null}
          </DataTable>
        </Card.Content>
      </Card>

      <Portal>
        <Dialog
          visible={dialogOpen && !!tenantId && hydrated}
          onDismiss={() => setDialogOpen(false)}
          style={{ maxWidth: 520, width: '100%', alignSelf: 'center' }}
        >
          <Dialog.Title>{editing ? `Edit ${editing.id}` : 'Add route'}</Dialog.Title>
          <Dialog.Content style={{ gap: 10 }}>
            <TextInput label="Route ID" value={id} onChangeText={setId} autoCapitalize="characters" />
            <TextInput label="Name" value={name} onChangeText={setName} />
            <TextInput label="Assigned vehicle id (optional)" value={vehicleId} onChangeText={setVehicleId} />
            <TextInput label="Assigned driver id (optional)" value={driverId} onChangeText={setDriverId} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Active</Text>
              <Switch value={active} onValueChange={setActive} />
            </View>
            <Text variant="labelSmall" style={{ opacity: 0.7 }}>
              Tip: add vehicles/drivers first, then assign their IDs here.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="text"
              onPress={() => {
                setEditingId(null);
                setId('');
                setName('');
                setVehicleId('');
                setDriverId('');
                setActive(true);
              }}
            >
              Clear
            </Button>
            <Button mode="contained" onPress={save} disabled={!id.trim() || !name.trim()}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}
