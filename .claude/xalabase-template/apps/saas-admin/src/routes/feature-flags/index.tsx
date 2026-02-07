/**
 * Feature Flags Route - XalaBaaS Backoffice
 *
 * Admin interface for managing feature flags and targeting rules.
 */
import { useMemo, useState } from 'react';
import {
    Spinner,
    Card,
    Heading,
    Stack,
    Paragraph,
    StatusTag,
    Grid,
    SearchIcon,
    DashboardPageHeader,
    Button,
    Text,
} from '@xala-technologies/platform-ui';
import { useT } from '@xalabaas/i18n';
import {
    useFlagDefinitions,
    useCreateFlag,
    useUpdateFlag,
    useDeleteFlag,
    type FlagDefinition,
} from '@xalabaas/sdk';
import { useTenant } from '@xalabaas/app-shell';

// ============================================================================
// Create Flag Form
// ============================================================================

function CreateFlagForm({
    tenantId,
    onClose,
}: {
    tenantId: string;
    onClose: () => void;
}) {
    const t = useT();
    const { mutateAsync: createFlag } = useCreateFlag();
    const [key, setKey] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState('boolean');
    const [defaultValue, setDefaultValue] = useState('false');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            let parsedDefault: unknown = defaultValue;
            if (type === 'boolean') parsedDefault = defaultValue === 'true';
            else if (type === 'number') parsedDefault = Number(defaultValue);

            await createFlag({
                tenantId: tenantId as any,
                key,
                name,
                type,
                defaultValue: parsedDefault,
                description: description || undefined,
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create flag');
        }
    };

    const inputStyle = {
        width: '100%',
        padding: 'var(--ds-spacing-2)',
        border: '1px solid var(--ds-color-neutral-border-default)',
        borderRadius: 'var(--ds-border-radius-md)',
        background: 'var(--ds-color-neutral-surface-default)',
        color: 'var(--ds-color-neutral-text-default)',
        fontSize: 'var(--ds-font-size-md)',
    };

    return (
        <Card data-color="neutral">
            <form onSubmit={handleSubmit}>
                <Stack direction="vertical" gap="md">
                    <Heading level={3} data-size="sm">
                        {t('backoffice.featureFlags.create', { defaultValue: 'Opprett feature flag' })}
                    </Heading>

                    <Stack direction="vertical" gap="xs">
                        <Text data-size="sm" style={{ fontWeight: 'var(--ds-font-weight-medium)' }}>Nokkel</Text>
                        <input
                            type="text"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="f.eks. new_booking_flow"
                            required
                            style={inputStyle}
                        />
                    </Stack>

                    <Stack direction="vertical" gap="xs">
                        <Text data-size="sm" style={{ fontWeight: 'var(--ds-font-weight-medium)' }}>Navn</Text>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="f.eks. Ny bookingflyt"
                            required
                            style={inputStyle}
                        />
                    </Stack>

                    <Stack direction="horizontal" gap="md">
                        <Stack direction="vertical" gap="xs" style={{ flex: 1 }}>
                            <Text data-size="sm" style={{ fontWeight: 'var(--ds-font-weight-medium)' }}>Type</Text>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="boolean">Boolean</option>
                                <option value="string">String</option>
                                <option value="number">Number</option>
                            </select>
                        </Stack>

                        <Stack direction="vertical" gap="xs" style={{ flex: 1 }}>
                            <Text data-size="sm" style={{ fontWeight: 'var(--ds-font-weight-medium)' }}>Standardverdi</Text>
                            {type === 'boolean' ? (
                                <select
                                    value={defaultValue}
                                    onChange={(e) => setDefaultValue(e.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="false">false</option>
                                    <option value="true">true</option>
                                </select>
                            ) : (
                                <input
                                    type={type === 'number' ? 'number' : 'text'}
                                    value={defaultValue}
                                    onChange={(e) => setDefaultValue(e.target.value)}
                                    style={inputStyle}
                                />
                            )}
                        </Stack>
                    </Stack>

                    <Stack direction="vertical" gap="xs">
                        <Text data-size="sm" style={{ fontWeight: 'var(--ds-font-weight-medium)' }}>Beskrivelse</Text>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Valgfri beskrivelse"
                            style={inputStyle}
                        />
                    </Stack>

                    {error && (
                        <Paragraph data-size="sm" style={{ color: 'var(--ds-color-danger-text-default)' }}>
                            {error}
                        </Paragraph>
                    )}

                    <Stack direction="horizontal" gap="sm" justify="end">
                        <Button variant="secondary" type="button" onClick={onClose}>
                            {t('common.cancel', { defaultValue: 'Avbryt' })}
                        </Button>
                        <Button variant="primary" type="submit">
                            {t('common.create', { defaultValue: 'Opprett' })}
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </Card>
    );
}

// ============================================================================
// Flag Card
// ============================================================================

function FlagCard({
    flag,
    tenantId,
}: {
    flag: FlagDefinition;
    tenantId: string;
}) {
    const { mutateAsync: updateFlag } = useUpdateFlag();
    const { mutateAsync: deleteFlag } = useDeleteFlag();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleToggleActive = async () => {
        await updateFlag({
            tenantId: tenantId as any,
            id: flag._id,
            isActive: !flag.isActive,
        });
    };

    const handleDelete = async () => {
        if (!confirm(`Slett "${flag.name}"?`)) return;
        setIsDeleting(true);
        try {
            await deleteFlag({ tenantId: tenantId as any, id: flag._id });
        } catch {
            setIsDeleting(false);
        }
    };

    return (
        <Card data-color="neutral" style={{ opacity: isDeleting ? 0.5 : 1 }}>
            <Stack direction="vertical" gap="sm">
                <Stack direction="horizontal" justify="between" align="start">
                    <Stack direction="vertical" gap="xs">
                        <Heading level={3} data-size="xs">{flag.name}</Heading>
                        <Paragraph data-size="xs" data-color="subtle" style={{ fontFamily: 'monospace' }}>
                            {flag.key}
                        </Paragraph>
                    </Stack>
                    <StatusTag
                        color={flag.isActive ? 'success' : 'warning'}
                        data-size="sm"
                    >
                        {flag.isActive ? 'Aktiv' : 'Inaktiv'}
                    </StatusTag>
                </Stack>

                {flag.description && (
                    <Paragraph data-size="sm" data-color="subtle">
                        {flag.description}
                    </Paragraph>
                )}

                <Stack direction="horizontal" gap="sm" align="center">
                    <StatusTag color="info" data-size="sm">{flag.type}</StatusTag>
                    <Text data-size="xs" data-color="subtle">
                        Standard: {String(flag.defaultValue)}
                    </Text>
                </Stack>

                <Stack direction="horizontal" gap="sm" justify="end">
                    <Button
                        variant="secondary"
                        data-size="sm"
                        onClick={handleToggleActive}
                    >
                        {flag.isActive ? 'Deaktiver' : 'Aktiver'}
                    </Button>
                    <Button
                        variant="secondary"
                        data-size="sm"
                        onClick={handleDelete}
                        style={{ color: 'var(--ds-color-danger-text-default)' }}
                    >
                        Slett
                    </Button>
                </Stack>
            </Stack>
        </Card>
    );
}

// ============================================================================
// Main Page
// ============================================================================

export function FeatureFlagsPage(): React.ReactElement {
    const t = useT();
    const { tenant } = useTenant();
    const tenantId = tenant?.id;
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);

    const { flags, isLoading } = useFlagDefinitions(tenantId as any);

    // Filter + group
    const filteredFlags = useMemo(() => {
        if (!flags || flags.length === 0) return [];
        if (!searchQuery) return flags;
        const query = searchQuery.toLowerCase();
        return flags.filter(
            f => f.key.toLowerCase().includes(query) ||
                f.name.toLowerCase().includes(query) ||
                f.type.toLowerCase().includes(query)
        );
    }, [flags, searchQuery]);

    const groupedFlags = useMemo(() => {
        const groups: Record<string, FlagDefinition[]> = {};
        filteredFlags.forEach(flag => {
            const group = flag.type;
            if (!groups[group]) groups[group] = [];
            groups[group].push(flag);
        });
        return groups;
    }, [filteredFlags]);

    if (isLoading && (!flags || flags.length === 0)) {
        return (
            <Stack direction="vertical" align="center" justify="center" gap="md" id="main-content">
                <Spinner aria-hidden="true" />
                <Paragraph data-size="sm">{t('common.loading', { defaultValue: 'Laster...' })}</Paragraph>
            </Stack>
        );
    }

    return (
        <Stack direction="vertical" gap="lg" id="main-content">
            <DashboardPageHeader
                title={t('backoffice.nav.featureFlags', { defaultValue: 'Feature Flags' })}
                subtitle={t('backoffice.featureFlags.subtitle', { defaultValue: 'Administrer feature flags og malretting' })}
            />

            {/* Actions Bar */}
            <Stack direction="horizontal" gap="md" justify="between" align="center">
                <Card data-color="neutral" style={{ flex: 1 }}>
                    <Stack direction="horizontal" gap="md" align="center">
                        <Stack direction="horizontal" align="center" gap="sm" style={{ flex: 1 }}>
                            <SearchIcon aria-hidden />
                            <input
                                type="text"
                                placeholder={t('common.search', { defaultValue: 'Sok flags...' })}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: 'var(--ds-spacing-2)',
                                    border: '1px solid var(--ds-color-neutral-border-default)',
                                    borderRadius: 'var(--ds-border-radius-md)',
                                    background: 'var(--ds-color-neutral-surface-default)',
                                    color: 'var(--ds-color-neutral-text-default)',
                                }}
                            />
                        </Stack>
                        <Paragraph data-size="sm" data-color="subtle">
                            {filteredFlags.length} flags
                        </Paragraph>
                    </Stack>
                </Card>
                <Button variant="primary" onClick={() => setShowCreateForm(!showCreateForm)}>
                    {showCreateForm ? t('common.cancel', { defaultValue: 'Avbryt' }) : t('common.create', { defaultValue: '+ Ny flag' })}
                </Button>
            </Stack>

            {/* Create Form */}
            {showCreateForm && tenantId && (
                <CreateFlagForm
                    tenantId={tenantId}
                    onClose={() => setShowCreateForm(false)}
                />
            )}

            {/* Flags by Type */}
            {Object.entries(groupedFlags).map(([type, typeFlags]) => (
                <Stack key={type} direction="vertical" gap="md">
                    <Heading level={2} data-size="sm" style={{ textTransform: 'capitalize' }}>
                        {type} flags
                    </Heading>
                    <Grid cols={{ base: 1, sm: 2, md: 3 }} gap="md">
                        {typeFlags.map((flag) => (
                            <FlagCard
                                key={flag._id}
                                flag={flag}
                                tenantId={tenantId!}
                            />
                        ))}
                    </Grid>
                </Stack>
            ))}

            {filteredFlags.length === 0 && !showCreateForm && (
                <Card data-color="neutral">
                    <Stack direction="vertical" align="center" gap="md" style={{ padding: 'var(--ds-spacing-8)' }}>
                        <Heading level={3} data-size="sm">
                            {t('backoffice.featureFlags.empty', { defaultValue: 'Ingen feature flags funnet' })}
                        </Heading>
                        <Paragraph data-size="sm" data-color="subtle">
                            {t('backoffice.featureFlags.emptyDesc', { defaultValue: 'Opprett din forste feature flag for a komme i gang.' })}
                        </Paragraph>
                    </Stack>
                </Card>
            )}
        </Stack>
    );
}

export default FeatureFlagsPage;
