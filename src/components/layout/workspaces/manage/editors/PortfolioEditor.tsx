import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import CrudEditorShell from "../shared/CrudEditorShell";
import PortfolioForm from "../forms/PortfolioForm";
import type{ PortfolioFormState, PortfolioFormMode } from "../forms/PortfolioForm";

import { getQMSBackend } from "../../../../../generated/sdk/endpoints";
import type {
  PortfolioCreate,
  PortfolioOut,
  PortfolioUpdate,
} from "../../../../../generated/sdk/models";

function normalizeError(e: any) {
  const status = e?.response?.status;
  const data = e?.response?.data;
  if (status) {
    const msg = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return `HTTP ${status}: ${msg}`;
  }
  return e?.message ?? "Unknown error";
}

// ----- Helpers to map between API and Form -----

function outToForm(p: PortfolioUpdate): PortfolioFormState {
  return {
    name: p.name ?? "",
    description: p.description ?? "",
    website: (p as any).website ?? "",
    workspace_type_id: (p as any).workspace_type_id ?? null,
    artifact_type_id: (p as any).artifact_type_id ?? null,
    template_id: (p as any).template_id ?? "",
    is_active: !!p.is_active,
    is_default: !!(p as any).is_default, // align to your API; if API uses "default", change here
    custom_properties_text: (p as any).custom_properties
      ? JSON.stringify((p as any).custom_properties, null, 2)
      : "",
    concurrency_guid: p.concurrency_guid ?? "",
  };
}

function formToCreatePayload(s: PortfolioFormState): PortfolioCreate {
  const custom =
    s.custom_properties_text.trim().length > 0
      ? (JSON.parse(s.custom_properties_text) as any)
      : null;

  return {
    name: s.name.trim(),
    description: s.description.trim() ? s.description.trim() : null,
    website: s.website.trim() ? s.website.trim() : null,
    workspace_type_id: s.workspace_type_id ?? null,
    artifact_type_id: s.artifact_type_id ?? null,
    is_active: s.is_active,
    is_default: s.is_default,
    template_id: s.template_id.trim() ? s.template_id.trim() : null,
    custom_properties: custom,
  };
}

function formToUpdatePayload(s: PortfolioFormState): PortfolioUpdate {
  const custom =
    s.custom_properties_text.trim().length > 0
      ? (JSON.parse(s.custom_properties_text) as any)
      : null;

  return {
    // update model has optionals; we can send values consistently
    name: s.name.trim() ? s.name.trim() : null,
    description: s.description.trim() ? s.description.trim() : null,
    website: s.website.trim() ? s.website.trim() : null,
    workspace_type_id: s.workspace_type_id ?? null,
    artifact_type_id: s.artifact_type_id ?? null,
    template_id: s.template_id.trim() ? s.template_id.trim() : null,
    is_active: s.is_active,
    is_default: s.is_default,
    custom_properties: custom,
    concurrency_guid: s.concurrency_guid, 
  };
}

export default function PortfolioEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const isEdit = !!id;
  const portfolioId = id ? Number(id) : null;

  const mode: PortfolioFormMode = isEdit ? "update" : "create";

  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState<PortfolioFormState>({
    name: "",
    description: "",
    website: "",
    workspace_type_id: null,
    artifact_type_id: null,
    template_id: "",
    is_active: true,
    is_default: false,
    custom_properties_text: "",
    concurrency_guid: "",
  });

  // ---- Load for edit ----
  React.useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!isEdit || !portfolioId) return;
      setLoading(true);
      setError(null);

      try {
        const api = getQMSBackend();

        // Adjust method name to match your SDK:
        const res = await api.portfolios_v1_get_getPortfolio(portfolioId);
        const data = (res.data ?? res) as PortfolioOut;

        if (!mounted) return;

        const next = outToForm(data);

        // Safety: update requires concurrency_guid
        if (!next.concurrency_guid) {
          // If your backend returns it under a different key, map it in outToForm().
          console.warn("Missing concurrency_guid on PortfolioOut; update will fail.");
        }

        setForm(next);
      } catch (e) {
        if (mounted) setError(normalizeError(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [isEdit, portfolioId]);

  // ---- Save rules ----
  const canSave = form.name.trim().length >= 2 && (mode === "create" || form.concurrency_guid.trim().length > 0);

  const onSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const api = getQMSBackend();

      if (!isEdit) {
        const payload = formToCreatePayload(form);
        // Adjust method name:
        await api.portfolios_v1_post_createPortfolio(payload);
      } else {
        if (!portfolioId) throw new Error("Missing portfolio id");
        if (!form.concurrency_guid) throw new Error("Missing concurrency_guid (required for update)");

        const payload = formToUpdatePayload(form);
        // Adjust method name + signature:
        await api.portfolios_v1_patch_updatePortfolio(portfolioId, payload);
      }

      navigate("/workspace/manage/portfolios", { replace: true });
    } catch (e) {
      setError(normalizeError(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!portfolioId) return;
    setDeleting(true);
    setError(null);

    try {
      const api = getQMSBackend();
      // Adjust method name:
      await (api as any).deletePortfolio(portfolioId);
      navigate("/workspace/manage/portfolios", { replace: true });
    } catch (e) {
      setError(normalizeError(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <CrudEditorShell
      title={isEdit ? "Update Portfolio" : "Add Portfolio"}
      subtitle={isEdit ? `Editing portfolio #${portfolioId}` : "Create a new portfolio"}
      loading={loading}
      saving={saving}
      deleting={deleting}
      error={error}
      canSave={canSave}
      onSave={onSave}
      onCancel={() => navigate(-1)}
      showDelete={isEdit}
      onDelete={isEdit ? onDelete : undefined}
    >
      <PortfolioForm mode={mode} value={form} onChange={setForm} showValidationSummary />
    </CrudEditorShell>
  );
}