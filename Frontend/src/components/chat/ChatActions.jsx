import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Loader2,
  MessageCircle,
  Phone,
  Search,
  UserPlus,
  UserRoundSearch,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { ChatListSkeleton } from "../ui/Skeleton";

const initialForms = {
  userSearch: "",
  groupName: "",
  contactName: "",
  contactMobile: "",
};

const actionConfig = {
  addContact: {
    title: "Add contact",
    description: "Save someone by name and mobile number.",
    icon: UserPlus,
    size: "md",
  },
  searchUser: {
    title: "Find people",
    description: "Search saved contacts or discover users on the platform.",
    icon: UserRoundSearch,
    size: "lg",
  },
  createGroup: {
    title: "Create group",
    description: "Name your group and select members to add.",
    icon: Users,
    size: "lg",
  },
  directChat: {
    title: "New chat",
    description: "Pick someone to start a direct conversation.",
    icon: MessageCircle,
    size: "lg",
  },
};

const getUserId = (user) => user?._id || user?.id || user;

const normalizeContact = (user, source = "directory") => {
  const linkedUser = user?.user || user?.contactUser;
  const linkedUserId = user?.userId || linkedUser?._id || linkedUser?.id;
  const rawId = getUserId(user)?.toString();
  const chatUserId = (linkedUserId || (source === "directory" ? rawId : null))?.toString();
  const id = (source === "directory" ? chatUserId : rawId || user?.mobile)?.toString();

  if (!id || typeof user !== "object") return null;

  return {
    id,
    chatUserId,
    name: user.displayName || user.name || linkedUser?.name || user.email || "Unknown user",
    email: user.email || linkedUser?.email || "",
    mobile: user.mobile || linkedUser?.mobile || "",
    profilePic: user.profilePic || linkedUser?.profilePic || "",
    status: user.status || linkedUser?.status || "inactive",
    isRegistered: Boolean(user.isRegistered ?? chatUserId),
    source,
  };
};

const mergeContacts = (...contactGroups) => {
  const contactsById = new Map();

  contactGroups.flat().forEach((contact) => {
    if (!contact?.chatUserId) return;

    const key = contact.chatUserId;
    const existingContact = contactsById.get(key);

    contactsById.set(key, {
      ...existingContact,
      ...contact,
      source: existingContact?.source === "saved" ? "saved" : contact.source,
    });
  });

  return Array.from(contactsById.values()).sort((first, second) =>
    first.name.localeCompare(second.name),
  );
};

export function ChatActions({
  activeAction,
  actionLoading,
  hasToken,
  savedContacts,
  onClose,
  onAddContact,
  onAccessChat,
  onSearchUsers,
  userSearchResults,
  isUserSearchLoading,
  onCreateGroup,
}) {
  const [forms, setForms] = useState(initialForms);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [lastSavedContact, setLastSavedContact] = useState(null);

  const config = useMemo(() => actionConfig[activeAction], [activeAction]);
  const isBusy = Boolean(actionLoading);
  const isGroupMode = activeAction === "createGroup";
  const hasSearchTerm = Boolean(forms.userSearch.trim());

  const savedContactList = useMemo(
    () =>
      (savedContacts || [])
        .map((contact) => normalizeContact(contact, "saved"))
        .filter((contact) => contact?.chatUserId),
    [savedContacts],
  );

  const directoryContacts = useMemo(
    () =>
      (userSearchResults || [])
        .map((user) => normalizeContact(user, "directory"))
        .filter(Boolean),
    [userSearchResults],
  );

  const contacts = useMemo(
    () => mergeContacts(savedContactList, directoryContacts),
    [directoryContacts, savedContactList],
  );

  const selectedContacts = useMemo(() => {
    const byId = new Map(contacts.map((contact) => [contact.chatUserId, contact]));

    return selectedUserIds
      .map((userId) => byId.get(userId))
      .filter(Boolean);
  }, [contacts, selectedUserIds]);

  const closeModal = useCallback(() => {
    setForms(initialForms);
    setSelectedUserIds([]);
    setLastSavedContact(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeModal();
    };

    if (activeAction) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeAction, closeModal]);

  useEffect(() => {
    if (!activeAction || !hasToken) return undefined;

    if (isGroupMode && !hasSearchTerm) {
      onSearchUsers("", { loadDefault: true });
      return undefined;
    }

    const searchTimer = window.setTimeout(() => {
      if (forms.userSearch.trim()) {
        onSearchUsers(forms.userSearch.trim());
      } else if (!isGroupMode) {
        onSearchUsers("");
      } else {
        onSearchUsers("", { loadDefault: true });
      }
    }, 280);

    return () => window.clearTimeout(searchTimer);
  }, [activeAction, forms.userSearch, hasSearchTerm, hasToken, isGroupMode, onSearchUsers]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForms((current) => ({ ...current, [name]: value }));
  };

  const openDirectChat = async (contactId) => {
    const result = await onAccessChat(contactId);
    if (result?.success) closeModal();
  };

  const toggleContact = (contact) => {
    if (!contact?.chatUserId) return;

    setSelectedUserIds((current) =>
      current.includes(contact.chatUserId)
        ? current.filter((id) => id !== contact.chatUserId)
        : [...current, contact.chatUserId],
    );
  };

  const handleAddContact = async (event) => {
    event.preventDefault();
    const result = await onAddContact({
      name: forms.contactName.trim(),
      mobile: forms.contactMobile.trim(),
    });

    if (result?.success) {
      setLastSavedContact(normalizeContact(result.contact, "saved"));
      setForms((current) => ({
        ...current,
        contactName: "",
        contactMobile: "",
      }));
    }
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    const result = await onCreateGroup({
      chatName: forms.groupName.trim(),
      users: selectedUserIds,
    });

    if (result?.success) closeModal();
  };

  const renderCreateGroupBody = () => (
    <form id="create-group-form" className="flex flex-col gap-4" onSubmit={handleCreateGroup}>
      <Input
        id="groupName"
        label="Group name"
        name="groupName"
        value={forms.groupName}
        onChange={updateField}
        placeholder="e.g. Design team, Family, Project Alpha"
        disabled={isBusy}
      />

      <ContactSearchField
        value={forms.userSearch}
        onChange={updateField}
        isLoading={isUserSearchLoading}
        placeholder="Filter members by name, email, or mobile"
        hint={`${contacts.length} available · ${selectedUserIds.length} selected`}
      />

      {selectedContacts.length > 0 ? (
        <SelectedMembersRow contacts={selectedContacts} onRemove={toggleContact} />
      ) : null}

      <ContactList
        contacts={contacts}
        emptyText={
          hasSearchTerm
            ? "No users match your search. Try a different name or email."
            : "No registered users available yet. Add contacts or try searching."
        }
        isLoading={isUserSearchLoading && contacts.length === 0}
        mode="multi"
        selectedUserIds={selectedUserIds}
        onContactClick={toggleContact}
      />
    </form>
  );

  const renderBody = () => {
    if (activeAction === "addContact") {
      return (
        <form className="grid gap-4" onSubmit={handleAddContact}>
          <Input
            id="contactName"
            label="Name"
            name="contactName"
            value={forms.contactName}
            onChange={updateField}
            placeholder="Contact name"
            disabled={isBusy}
          />

          <Input
            id="contactMobile"
            label="Mobile number"
            name="contactMobile"
            icon={Phone}
            value={forms.contactMobile}
            onChange={updateField}
            inputMode="tel"
            placeholder="10 digit mobile number"
            disabled={isBusy}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={
              isBusy ||
              !forms.contactName.trim() ||
              forms.contactMobile.replace(/\D/g, "").length < 10
            }
          >
            {actionLoading === "addContact" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : null}
            Add contact
          </Button>

          {lastSavedContact ? (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={lastSavedContact.name} src={lastSavedContact.profilePic} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {lastSavedContact.name}
                  </p>
                  <p className="truncate text-xs text-[var(--text-secondary)]">
                    {lastSavedContact.mobile}
                  </p>
                </div>
              </div>
              {lastSavedContact.chatUserId ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={() => openDirectChat(lastSavedContact.chatUserId)}
                >
                  <MessageCircle size={17} />
                  Start chat
                </Button>
              ) : (
                <p className="mt-3 text-xs text-[var(--text-secondary)]">
                  Contact saved. Chat unlocks when they register with this number.
                </p>
              )}
            </div>
          ) : null}
        </form>
      );
    }

    if (isGroupMode) {
      return renderCreateGroupBody();
    }

    return (
      <div className="grid gap-4">
        <ContactSearchField
          value={forms.userSearch}
          onChange={updateField}
          isLoading={isUserSearchLoading}
          placeholder="Search by name, email, or mobile"
        />

        <ContactList
          contacts={contacts}
          emptyText={
            hasSearchTerm
              ? "No users found. Try another search term."
              : "Search to find people on the platform."
          }
          isLoading={isUserSearchLoading && !contacts.length}
          mode="single"
          selectedUserIds={[]}
          onContactClick={(contact) => openDirectChat(contact.chatUserId)}
          actionLoading={actionLoading}
        />
      </div>
    );
  };

  const renderFooter = () => {
    if (!isGroupMode) return null;

    return (
      <Button
        type="submit"
        form="create-group-form"
        className="w-full"
        size="lg"
        disabled={isBusy || !forms.groupName.trim() || selectedUserIds.length === 0}
      >
        {actionLoading === "createGroup" ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Users size={18} />
        )}
        Create group
        {selectedUserIds.length > 0 ? ` · ${selectedUserIds.length} member${selectedUserIds.length > 1 ? "s" : ""}` : ""}
      </Button>
    );
  };

  return (
    <Modal
      isOpen={Boolean(activeAction && config)}
      onClose={closeModal}
      title={config?.title}
      description={config?.description}
      icon={config?.icon}
      size={config?.size || "md"}
      footer={renderFooter()}
    >
      {!hasToken ? (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Sign in to load contacts and create conversations.
        </div>
      ) : null}

      {renderBody()}
    </Modal>
  );
}

function ContactSearchField({ value, onChange, isLoading, placeholder, hint }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
        Search members
      </label>
      <div className="relative">
        <Search
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          name="userSearch"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-input)] py-3 pl-10 pr-10 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
        />
        {isLoading ? (
          <Loader2
            size={17}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-indigo-400"
          />
        ) : null}
      </div>
      {hint ? <p className="mt-1.5 text-xs text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );
}

function SelectedMembersRow({ contacts, onRemove }) {
  return (
    <div className="rounded-2xl border border-indigo-400/25 bg-indigo-500/10 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
        Selected members
      </p>
      <div className="flex flex-wrap gap-2">
        {contacts.map((contact) => (
          <button
            key={contact.chatUserId}
            type="button"
            onClick={() => onRemove(contact)}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-[var(--bg-elevated)] py-1 pl-1 pr-2 text-xs font-semibold text-[var(--text-primary)] transition hover:border-red-400/40 hover:bg-red-500/10"
          >
            <Avatar name={contact.name} src={contact.profilePic} size="sm" />
            <span className="max-w-[120px] truncate">{contact.name}</span>
            <X size={12} className="text-[var(--text-muted)]" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ContactList({
  contacts,
  emptyText,
  isLoading,
  mode,
  selectedUserIds,
  onContactClick,
  actionLoading,
}) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)]">
        <ChatListSkeleton count={5} />
      </div>
    );
  }

  if (!contacts.length) {
    return (
      <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)] px-6 text-center text-sm text-[var(--text-secondary)]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)]">
      <div className="custom-scrollbar max-h-64 overflow-y-auto p-2 sm:max-h-72">
        {contacts.map((contact) => {
          const isSelected = selectedUserIds.includes(contact.chatUserId);
          const isMulti = mode === "multi";

          return (
            <button
              key={contact.chatUserId}
              type="button"
              onClick={() => onContactClick(contact)}
              disabled={!isMulti && (actionLoading === "accessChat" || !contact.chatUserId)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                isSelected
                  ? "bg-indigo-500/15 ring-1 ring-indigo-400/35"
                  : "hover:bg-white/5"
              } disabled:cursor-wait disabled:opacity-60`}
            >
              <Avatar
                name={contact.name}
                src={contact.profilePic}
                size="md"
                isOnline={contact.status === "active" || contact.status === "online"}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {contact.name}
                  </span>
                  {contact.source === "saved" ? (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      saved
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-xs text-[var(--text-secondary)]">
                  {contact.mobile || contact.email || "On platform"}
                </span>
              </span>
              {isMulti ? (
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full border transition ${
                    isSelected
                      ? "border-indigo-400 bg-indigo-500 text-white"
                      : "border-[var(--border-strong)] bg-transparent text-transparent"
                  }`}
                >
                  <Check size={14} strokeWidth={3} />
                </span>
              ) : (
                <MessageCircle size={18} className="shrink-0 text-indigo-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
