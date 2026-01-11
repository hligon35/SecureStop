import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, DataTable, Dialog, Portal, Switch, Text, TextInput } from 'react-native-paper';

import { useAdminRegistryStore } from '@/store/adminRegistry';
import { useAuthStore } from '@/store/auth';

export default function AdminWebDrivers() {
  const tenantId = useAuthStore((s) => s.schoolId);

  const hydrated = useAdminRegistryStore((s) => s.hydrated);
  const ensureTenant = useAdminRegistryStore((s) => s.ensureTenant);
  const reg = useAdminRegistryStore((s) => s.byTenant[tenantId]);
  const addDriver = useAdminRegistryStore((s) => s.addDriver);
  const updateDriver = useAdminRegistryStore((s) => s.updateDriver);
  const deleteDriver = useAdminRegistryStore((s) => s.deleteDriver);

  useEffect(() => {
    if (!tenantId) return;
    ensureTenant(tenantId);
  }, [ensureTenant, tenantId]);

  const drivers = reg?.drivers ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(() => drivers.find((d) => d.id === editingId) ?? null, [drivers, editingId]);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseId, setLicenseId] = useState('');
  const [active, setActive] = useState(true);
  const [assignedVehicleId, setAssignedVehicleId] = useState('');

  function openCreate() {
    setEditingId(null);
    setId('');
    setName('');
    setPhone('');
    setLicenseId('');
    setActive(true);
    setAssignedVehicleId('');
    setDialogOpen(true);
  }

  function openEdit(driverId: string) {
    const d = drivers.find((x) => x.id === driverId);
    if (!d) return;
    setEditingId(driverId);
    setId(d.id);
    setName(d.name);
    setPhone(d.phone ?? '');
    setLicenseId(d.licenseId ?? '');
    setActive(d.active);
    setAssignedVehicleId(d.assignedVehicleId ?? '');
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
      phone: phone.trim() || undefined,
      licenseId: licenseId.trim() || undefined,
      active,
      assignedVehicleId: assignedVehicleId.trim() || undefined,
    };

    if (editing) updateDriver(tenantId, editing.id, payload);
    else addDriver(tenantId, payload);

    setDialogOpen(false);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Drivers" subtitle="Web" />
        <Card.Content>
          <Text variant="labelSmall" style={{ opacity: 0.7 }}>
            Tenant: {tenantId || '—'}
          </Text>
          <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>Driver management and assignments</Text>
            <Button mode="contained" onPress={openCreate} disabled={!hydrated || !tenantId}>
              Add driver
            </Button>
          </View>

          <DataTable style={{ marginTop: 12 }}>
            <DataTable.Header>
              <DataTable.Title>ID</DataTable.Title>
              <DataTable.Title>Name</DataTable.Title>
              <DataTable.Title>Active</DataTable.Title>
              <DataTable.Title>Vehicle</DataTable.Title>
              <DataTable.Title numeric>Actions</DataTable.Title>
            </DataTable.Header>

            {drivers.map((d) => (
              <DataTable.Row key={d.id}>
                <DataTable.Cell>{d.id}</DataTable.Cell>
                <DataTable.Cell>{d.name}</DataTable.Cell>
                <DataTable.Cell>{d.active ? 'Yes' : 'No'}</DataTable.Cell>
                <DataTable.Cell>{d.assignedVehicleId ?? '—'}</DataTable.Cell>
                <DataTable.Cell numeric>
                  <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                    <Button compact mode="outlined" onPress={() => openEdit(d.id)}>
                      Edit
                    </Button>
                    <Button
                      compact
                      mode="text"
                      onPress={() => {
                        if (!tenantId) return;
                        deleteDriver(tenantId, d.id);
                      }}
                    >
                      Remove
                    </Button>
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            ))}

            {drivers.length === 0 ? (
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
          <Dialog.Title>{editing ? `Edit ${editing.id}` : 'Add driver'}</Dialog.Title>
          <Dialog.Content style={{ gap: 10 }}>
            <TextInput label="Driver ID" value={id} onChangeText={setId} autoCapitalize="characters" />
            <TextInput label="Name" value={name} onChangeText={setName} />
            <TextInput label="Phone (optional)" value={phone} onChangeText={setPhone} />
            <TextInput label="License ID (optional)" value={licenseId} onChangeText={setLicenseId} />
            <TextInput label="Assigned vehicle id (optional)" value={assignedVehicleId} onChangeText={setAssignedVehicleId} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Active</Text>
              <Switch value={active} onValueChange={setActive} />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="text"
              onPress={() => {
                setEditingId(null);
                setId('');
                setName('');
                setPhone('');
                setLicenseId('');
                setActive(true);
                setAssignedVehicleId('');
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
