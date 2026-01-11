import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Chip, Divider, HelperText, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';

import { useNotificationStore } from '@/store/notifications';
import { useTripStore } from '@/store/trip';

export default function DriverIncidentScreen() {
  const theme = useTheme();
  const sendDriverAlert = useNotificationStore((s) => s.sendDriverAlert);
  const vehicleId = useTripStore((s) => s.vehicleId);

  const [category, setCategory] = useState<string>('');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [students, setStudents] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () => ['Accident', 'Medical', 'Behavior', 'Vehicle', 'Security', 'Other'],
    []
  );

  const canSubmit = category.trim().length > 0 && description.trim().length >= 10;

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card>
          <Card.Content style={{ gap: 12 }}>
            <Text variant="titleMedium">Driver Report</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Submit details to School/Admin (stored as an alert note in this build).
            </Text>

            <Divider />

            <View style={{ gap: 8 }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Category
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {categoryOptions.map((c) => (
                  <Chip key={c} selected={category === c} onPress={() => setCategory(c)}>
                    {c}
                  </Chip>
                ))}
              </View>
              {category.trim().length === 0 ? (
                <HelperText type="error" visible>
                  Choose a category.
                </HelperText>
              ) : null}
            </View>

            <View style={{ gap: 8 }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Severity
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(['Low', 'Medium', 'High', 'Critical'] as const).map((s) => (
                  <Chip key={s} selected={severity === s} onPress={() => setSeverity(s)}>
                    {s}
                  </Chip>
                ))}
              </View>
            </View>

            <TextInput
              mode="outlined"
              label="Description (required)"
              placeholder="What happened? Include who/what/when."
              value={description}
              multiline
              onChangeText={setDescription}
            />
            <HelperText type={description.trim().length >= 10 ? 'info' : 'error'} visible>
              {description.trim().length >= 10 ? ' ' : 'Add at least 10 characters.'}
            </HelperText>

            <TextInput
              mode="outlined"
              label="Location (optional)"
              placeholder="Intersection, stop name, landmark"
              value={location}
              onChangeText={setLocation}
            />

            <TextInput
              mode="outlined"
              label="Students involved (optional)"
              placeholder="Names or IDs (comma-separated)"
              value={students}
              onChangeText={setStudents}
            />

            <TextInput
              mode="outlined"
              label="Actions taken (optional)"
              placeholder="Called dispatch, separated students, pulled over, etc."
              value={actionsTaken}
              multiline
              onChangeText={setActionsTaken}
            />

            <Button
              mode="contained"
              icon="send"
              disabled={!canSubmit || submitting}
              loading={submitting}
              contentStyle={{ height: 52 }}
              onPress={async () => {
                if (!canSubmit) return;
                try {
                  setSubmitting(true);

                  const notes: string[] = [
                    `Category: ${category}`,
                    `Severity: ${severity}`,
                    `Description: ${description.trim()}`,
                  ];
                  if (location.trim()) notes.push(`Location: ${location.trim()}`);
                  if (students.trim()) notes.push(`Students: ${students.trim()}`);
                  if (actionsTaken.trim()) notes.push(`Actions: ${actionsTaken.trim()}`);
                  notes.push(`Time: ${new Date().toLocaleString()}`);

                  await sendDriverAlert({
                    templateId: 'driver_report_submitted',
                    recipients: 'school',
                    notes,
                    vehicleId,
                  });

                  setSnack('Report sent to School/Admin');
                  setCategory('');
                  setSeverity('High');
                  setDescription('');
                  setLocation('');
                  setStudents('');
                  setActionsTaken('');
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Submit report
            </Button>
          </Card.Content>
        </Card>

        <View />
      </ScrollView>

      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2200}>
        {snack ?? ''}
      </Snackbar>
    </>
  );
}
