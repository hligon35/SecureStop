import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, DataTable, Dialog, Portal, Text, TextInput } from 'react-native-paper';

import { useAdminRegistryStore, type VehicleStatus } from '@/store/adminRegistry';
import { useAuthStore } from '@/store/auth';

export default function AdminWebVehicles() {
  const tenantId = useAuthStore((s) => s.schoolId);

  const hydrated = useAdminRegistryStore((s) => s.hydrated);
  const ensureTenant = useAdminRegistryStore((s) => s.ensureTenant);
  const reg = useAdminRegistryStore((s) => s.byTenant[tenantId]);
  const addVehicle = useAdminRegistryStore((s) => s.addVehicle);
  const updateVehicle = useAdminRegistryStore((s) => s.updateVehicle);
  const deleteVehicle = useAdminRegistryStore((s) => s.deleteVehicle);

  useEffect(() => {
    if (!tenantId) return;
    ensureTenant(tenantId);
  }, [ensureTenant, tenantId]);

  const vehicles = reg?.vehicles ?? [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(() => vehicles.find((v) => v.id === editingId) ?? null, [editingId, vehicles]);

  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('active');
  const [assignedRouteId, setAssignedRouteId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  function openCreate() {
    setEditingId(null);
    setId('');
    setLabel('');
    setStatus('active');
    setAssignedRouteId('');
    setDialogOpen(true);
  }

  function openEdit(vehicleId: string) {
    const v = vehicles.find((x) => x.id === vehicleId);
    if (!v) return;
    setEditingId(vehicleId);
    setId(v.id);
    setLabel(v.label);
    setStatus(v.status);
    setAssignedRouteId(v.assignedRouteId ?? '');
    setDialogOpen(true);
  }

  function save() {
    const nextId = id.trim();
    const nextLabel = label.trim();
    if (!tenantId) return;
    if (!nextId || !nextLabel) return;

    if (editing) {
      updateVehicle(tenantId, editing.id, {
        id: nextId,
        label: nextLabel,
        status,
        assignedRouteId: assignedRouteId.trim() || undefined,
      });
    } else {
      addVehicle(tenantId, {
        id: nextId,
        label: nextLabel,
        status,
        assignedRouteId: assignedRouteId.trim() || undefined,
      });
    }
    setDialogOpen(false);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Vehicles" subtitle="Web" />
        <Card.Content>
          <Text variant="labelSmall" style={{ opacity: 0.7 }}>
            Tenant: {tenantId || '—'}
          </Text>
          <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>Vehicle registry and assignments</Text>
            <Button mode="contained" onPress={openCreate} disabled={!hydrated || !tenantId}>
              Add vehicle
            </Button>
          </View>

          <DataTable style={{ marginTop: 12 }}>
            <DataTable.Header>
              <DataTable.Title>ID</DataTable.Title>
              <DataTable.Title>Label</DataTable.Title>
              <DataTable.Title>Status</DataTable.Title>
              <DataTable.Title>Route</DataTable.Title>
              <DataTable.Title numeric>Actions</DataTable.Title>
            </DataTable.Header>

            {vehicles.map((v) => (
              <DataTable.Row key={v.id}>
                <DataTable.Cell>{v.id}</DataTable.Cell>
                <DataTable.Cell>{v.label}</DataTable.Cell>
                <DataTable.Cell>{v.status}</DataTable.Cell>
                <DataTable.Cell>{v.assignedRouteId ?? '—'}</DataTable.Cell>
                <DataTable.Cell numeric>
                  <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                    <Button compact mode="outlined" onPress={() => openEdit(v.id)}>
                      Edit
                    </Button>
                    <Button
                      compact
                      mode="text"
                      onPress={() => {
                        if (!tenantId) return;
                        deleteVehicle(tenantId, v.id);
                      }}
                    >
                      Remove
                    </Button>
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            ))}

            {vehicles.length === 0 ? (
              <DataTable.Row>
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
          <Dialog.Title>{editing ? `Edit ${editing.id}` : 'Add vehicle'}</Dialog.Title>
          <Dialog.Content style={{ gap: 10 }}>
            <TextInput label="Vehicle ID" value={id} onChangeText={setId} autoCapitalize="characters" />
            <TextInput label="Label" value={label} onChangeText={setLabel} />
            <TextInput
              label="Status (active | maintenance | inactive)"
              value={status}
              onChangeText={(v) => setStatus((v as VehicleStatus) || 'active')}
            />
            <TextInput label="Assigned route id (optional)" value={assignedRouteId} onChangeText={setAssignedRouteId} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="text"
              onPress={() => {
                setEditingId(null);
                setId('');
                setLabel('');
                setStatus('active');
                setAssignedRouteId('');
              }}
            >
              Clear
            </Button>
            <Button mode="contained" onPress={save} disabled={!id.trim() || !label.trim()}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}
