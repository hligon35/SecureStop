import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, DataTable, Dialog, Portal, Switch, Text, TextInput } from 'react-native-paper';

import { useAdminRegistryStore } from '@/store/adminRegistry';
import { useAuthStore } from '@/store/auth';

export default function AdminWebStudents() {
  const tenantId = useAuthStore((s) => s.schoolId);

  const hydrated = useAdminRegistryStore((s) => s.hydrated);
  const ensureTenant = useAdminRegistryStore((s) => s.ensureTenant);
  const reg = useAdminRegistryStore((s) => s.byTenant[tenantId]);
  const addStudent = useAdminRegistryStore((s) => s.addStudent);
  const updateStudent = useAdminRegistryStore((s) => s.updateStudent);
  const deleteStudent = useAdminRegistryStore((s) => s.deleteStudent);

  useEffect(() => {
    if (!tenantId) return;
    ensureTenant(tenantId);
  }, [ensureTenant, tenantId]);

  const students = reg?.students ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(() => students.find((s) => s.id === editingId) ?? null, [editingId, students]);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [parentName, setParentName] = useState('');
  const [stopName, setStopName] = useState('');
  const [active, setActive] = useState(true);

  function openCreate() {
    setEditingId(null);
    setId('');
    setName('');
    setGrade('');
    setParentName('');
    setStopName('');
    setActive(true);
    setDialogOpen(true);
  }

  function openEdit(studentId: string) {
    const s = students.find((x) => x.id === studentId);
    if (!s) return;
    setEditingId(studentId);
    setId(s.id);
    setName(s.name);
    setGrade(s.grade ?? '');
    setParentName(s.parentName ?? '');
    setStopName(s.stopName ?? '');
    setActive(s.active);
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
      grade: grade.trim() || undefined,
      parentName: parentName.trim() || undefined,
      stopName: stopName.trim() || undefined,
      active,
    };

    if (editing) updateStudent(tenantId, editing.id, payload);
    else addStudent(tenantId, payload);

    setDialogOpen(false);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Students / Riders" subtitle="Web" />
        <Card.Content>
          <Text variant="labelSmall" style={{ opacity: 0.7 }}>
            Tenant: {tenantId || '—'}
          </Text>
          <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>Riders, guardians, and stop assignment</Text>
            <Button mode="contained" onPress={openCreate} disabled={!hydrated || !tenantId}>
              Add student
            </Button>
          </View>

          <DataTable style={{ marginTop: 12 }}>
            <DataTable.Header>
              <DataTable.Title>ID</DataTable.Title>
              <DataTable.Title>Name</DataTable.Title>
              <DataTable.Title>Grade</DataTable.Title>
              <DataTable.Title>Stop</DataTable.Title>
              <DataTable.Title numeric>Actions</DataTable.Title>
            </DataTable.Header>

            {students.map((s) => (
              <DataTable.Row key={s.id}>
                <DataTable.Cell>{s.id}</DataTable.Cell>
                <DataTable.Cell>{s.name}</DataTable.Cell>
                <DataTable.Cell>{s.grade ?? '—'}</DataTable.Cell>
                <DataTable.Cell>{s.stopName ?? '—'}</DataTable.Cell>
                <DataTable.Cell numeric>
                  <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                    <Button compact mode="outlined" onPress={() => openEdit(s.id)}>
                      Edit
                    </Button>
                    <Button
                      compact
                      mode="text"
                      onPress={() => {
                        if (!tenantId) return;
                        deleteStudent(tenantId, s.id);
                      }}
                    >
                      Remove
                    </Button>
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            ))}

            {students.length === 0 ? (
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
          <Dialog.Title>{editing ? `Edit ${editing.id}` : 'Add student'}</Dialog.Title>
          <Dialog.Content style={{ gap: 10 }}>
            <TextInput label="Student ID" value={id} onChangeText={setId} autoCapitalize="characters" />
            <TextInput label="Name" value={name} onChangeText={setName} />
            <TextInput label="Grade (optional)" value={grade} onChangeText={setGrade} />
            <TextInput label="Parent/guardian (optional)" value={parentName} onChangeText={setParentName} />
            <TextInput label="Stop name (optional)" value={stopName} onChangeText={setStopName} />
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
                setGrade('');
                setParentName('');
                setStopName('');
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
