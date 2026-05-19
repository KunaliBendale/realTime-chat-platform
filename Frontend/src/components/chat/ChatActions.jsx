import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
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

const initialForms = {
  userSearch: "",
  groupName: "",
  contactName: "",
  contactMobile: "",
};

const actionConfig = {
  addContact: {
    title: "Add User",
    description: "Save a contact by name and mobile number.",
    icon: UserPlus,
  },
  searchUser: {
    title: "Search Contacts",
    description: "Search saved contacts or find someone by mobile number.",
    icon: UserRoundSearch,
  },
  createGroup: {
    title: "Create Group",
    description: "Select contacts and create a group conversation.",
    icon: Users,
  },
  directChat: {
    title: "New Chat",
    description: "Choose a contact to open a one-to-one conversation.",
    icon: MessageCircle,
  },
};

const getUserId = (user) => user?._id || user?.id || user;

const getInitials = (name = "User") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

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
    if (!contact?.id) return;
    const key = contact.chatUserId || contact.mobile || contact.id;
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
  const hasSearchTerm = Boolean(forms.userSearch.trim());

  const savedContactList = useMemo(
    () =>
      (savedContacts || [])
        .map((contact) => normalizeContact(contact, "saved"))
        .filter(Boolean),
    [savedContacts],
  );
  const directoryContacts = useMemo(
    () =>
      hasSearchTerm
        ? (userSearchResults || [])
            .map((user) => normalizeContact(user, "directory"))
            .filter(Boolean)
        : [],
    [hasSearchTerm, userSearchResults],
  );
  const contacts = useMemo(
    () => mergeContacts(savedContactList, directoryContacts),
    [directoryContacts, savedContactList],
  );
  const selectedContacts = useMemo(
    () => contacts.filter((contact) => selectedUserIds.includes(contact.chatUserId)),
    [contacts, selectedUserIds],
  );
  const searchPlaceholder =
    activeAction === "createGroup" ? "Search contacts to add" : "Search contacts";

  const closeModal = useCallback(() => {
    setForms(initialForms);
    setSelectedUserIds([]);
    setLastSavedContact(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    if (activeAction) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeAction, closeModal]);

  useEffect(() => {
    if (!activeAction || !hasToken) return;

    const searchTimer = window.setTimeout(() => {
      if (forms.userSearch.trim()) {
        onSearchUsers(forms.userSearch.trim());
      } else {
        onSearchUsers("");
      }
    }, 250);

    return () => {
      window.clearTimeout(searchTimer);
    };
  }, [activeAction, forms.userSearch, hasToken, onSearchUsers]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForms((currentForms) => ({
      ...currentForms,
      [name]: value,
    }));
  };

  const openDirectChat = async (contactId) => {
    const result = await onAccessChat(contactId);

    if (result?.success) {
      closeModal();
    }
  };

  const toggleContact = (contact) => {
    if (!contact.chatUserId) return;

    setSelectedUserIds((currentIds) =>
      currentIds.includes(contact.chatUserId)
        ? currentIds.filter((id) => id !== contact.chatUserId)
        : [...currentIds, contact.chatUserId],
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
      setForms((currentForms) => ({
        ...currentForms,
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

    if (result?.success) {
      closeModal();
    }
  };

  const renderBody = () => {
    if (activeAction === "addContact") {
      return (
        <form className="grid gap-4" onSubmit={handleAddContact}>
          <label className="grid gap-2 text-sm font-semibold text-[#172033]">
            Name
            <input
              name="contactName"
              value={forms.contactName}
              onChange={updateField}
              placeholder="Contact name"
              className="rounded-lg border border-[#cfd6e3] bg-white/90 px-3 py-3 text-sm font-normal text-[#172033] outline-none transition placeholder:text-[#8b97aa] focus:border-[#128c7e] focus:ring-4 focus:ring-[#128c7e]/10"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#172033]">
            Mobile number
            <div className="relative">
              <Phone
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#66758c]"
              />
              <input
                name="contactMobile"
                value={forms.contactMobile}
                onChange={updateField}
                inputMode="tel"
                placeholder="10 digit mobile number"
                className="w-full rounded-lg border border-[#cfd6e3] bg-white/90 py-3 pl-10 pr-3 text-sm font-normal text-[#172033] outline-none transition placeholder:text-[#8b97aa] focus:border-[#128c7e] focus:ring-4 focus:ring-[#128c7e]/10"
              />
            </div>
          </label>

          <PrimaryButton
            disabled={
              isBusy ||
              !forms.contactName.trim() ||
              forms.contactMobile.replace(/\D/g, "").length < 10
            }
            isLoading={actionLoading === "addContact"}
          >
            Add Contact
          </PrimaryButton>

          {lastSavedContact ? (
            <div className="rounded-lg border border-[#c8eadf] bg-[#effaf6] p-3">
              <div className="flex items-center gap-3">
                <ContactAvatar contact={lastSavedContact} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#172033]">
                    {lastSavedContact.name}
                  </span>
                  <span className="block truncate text-xs text-[#66758c]">
                    {lastSavedContact.mobile}
                  </span>
                </span>
              </div>
              {lastSavedContact.chatUserId ? (
                <button
                  type="button"
                  onClick={() => openDirectChat(lastSavedContact.chatUserId)}
                  className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#128c7e] px-3 text-sm font-semibold text-white transition hover:bg-[#0f766d]"
                >
                  <MessageCircle size={17} />
                  Start Chat
                </button>
              ) : (
                <p className="mt-3 text-xs leading-5 text-[#66758c]">
                  Contact saved. Chat will become available when this mobile number joins.
                </p>
              )}
            </div>
          ) : null}
        </form>
      );
    }

    if (activeAction === "createGroup") {
      return (
        <form className="grid min-h-0 gap-4" onSubmit={handleCreateGroup}>
          <label className="grid gap-2 text-sm font-semibold text-[#172033]">
            Group name
            <input
              name="groupName"
              value={forms.groupName}
              onChange={updateField}
              placeholder="Project team"
              className="rounded-lg border border-[#cfd6e3] bg-white/90 px-3 py-3 text-sm font-normal text-[#172033] outline-none transition placeholder:text-[#8b97aa] focus:border-[#128c7e] focus:ring-4 focus:ring-[#128c7e]/10"
            />
          </label>

          <ContactSearchField
            value={forms.userSearch}
            onChange={updateField}
            isLoading={isUserSearchLoading}
            placeholder={searchPlaceholder}
          />

          {selectedContacts.length ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {selectedContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => toggleContact(contact)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#e8f5f2] py-1 pl-1 pr-2 text-xs font-semibold text-[#128c7e]"
                >
                  <ContactAvatar contact={contact} size="sm" />
                  {contact.name}
                  <X size={13} />
                </button>
              ))}
            </div>
          ) : null}

          <ContactList
            contacts={contacts}
            emptyText="Add saved contacts first, or search by mobile number."
            isLoading={isUserSearchLoading && !contacts.length}
            mode="multi"
            selectedUserIds={selectedUserIds}
            onContactClick={toggleContact}
          />

          <PrimaryButton
            disabled={isBusy || !forms.groupName.trim() || selectedUserIds.length === 0}
            isLoading={actionLoading === "createGroup"}
          >
            Create Group
            {selectedUserIds.length ? ` (${selectedUserIds.length})` : ""}
          </PrimaryButton>
        </form>
      );
    }

    return (
      <div className="grid min-h-0 gap-4">
        <ContactSearchField
          value={forms.userSearch}
          onChange={updateField}
          isLoading={isUserSearchLoading}
          placeholder={searchPlaceholder}
        />

        <ContactList
          contacts={contacts}
          emptyText="Search for a contact to start a conversation."
          isLoading={isUserSearchLoading && !contacts.length}
          mode="single"
          selectedUserIds={[]}
          onContactClick={(contact) => openDirectChat(contact.chatUserId)}
          actionLoading={actionLoading}
        />
      </div>
    );
  };

  const Icon = config?.icon;

  return (
    <AnimatePresence>
      {activeAction && config ? (
        <Motion.div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-[#0f172a]/45 p-0 backdrop-blur-md sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={closeModal}
        >
          <Motion.section
            className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-white p-5 shadow-2xl shadow-[#0f172a]/20 sm:h-auto sm:max-h-[88vh] sm:max-w-xl sm:rounded-lg sm:border sm:border-white/60 sm:bg-white/80 sm:p-6 sm:backdrop-blur-xl"
            initial={{ opacity: 0, y: 56, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 56, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-action-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#e5e9f0] pb-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#e8f5f2] text-[#128c7e]">
                  {Icon ? <Icon size={20} /> : null}
                </span>
                <span className="min-w-0">
                  <h2
                    id="chat-action-title"
                    className="text-lg font-semibold text-[#172033]"
                  >
                    {config.title}
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-[#66758c]">
                    {config.description}
                  </p>
                </span>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-[#d9dee8] bg-white/80 text-[#66758c] transition hover:border-[#128c7e] hover:text-[#128c7e]"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {!hasToken ? (
              <div className="mt-4 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-xs leading-5 text-[#92400e]">
                Sign in with a valid JWT to load contacts and create chats.
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto pt-5">{renderBody()}</div>
          </Motion.section>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ContactSearchField({ value, onChange, isLoading, placeholder }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#172033]">
      Search
      <div className="relative">
        <Search
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#66758c]"
        />
        <input
          name="userSearch"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[#cfd6e3] bg-white/90 py-3 pl-10 pr-10 text-sm font-normal text-[#172033] outline-none transition placeholder:text-[#8b97aa] focus:border-[#128c7e] focus:ring-4 focus:ring-[#128c7e]/10"
        />
        {isLoading ? (
          <Loader2
            size={17}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#66758c]"
          />
        ) : null}
      </div>
    </label>
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
      <div className="grid min-h-52 place-items-center rounded-lg border border-[#d9dee8] bg-white/75 text-sm text-[#66758c]">
        Loading contacts...
      </div>
    );
  }

  if (!contacts.length) {
    return (
      <div className="grid min-h-52 place-items-center rounded-lg border border-[#d9dee8] bg-white/75 px-4 text-center text-sm text-[#66758c]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="min-h-52 overflow-hidden rounded-lg border border-[#d9dee8] bg-white/80">
      <div className="max-h-72 overflow-y-auto p-2">
        {contacts.map((contact) => {
          const isSelected = selectedUserIds.includes(contact.chatUserId);
          const canStartChat = Boolean(contact.chatUserId);

          return (
            <button
              key={contact.id}
              type="button"
              onClick={() => onContactClick(contact)}
              disabled={!canStartChat || actionLoading === "accessChat"}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                isSelected
                  ? "bg-[#e8f5f2] text-[#128c7e]"
                  : "text-[#172033] hover:bg-[#f1f5f9]"
              } disabled:cursor-wait disabled:opacity-70`}
            >
              <ContactAvatar contact={contact} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{contact.name}</span>
                  {contact.source === "saved" ? (
                    <span className="rounded-full bg-[#edf1f7] px-2 py-0.5 text-[11px] font-semibold text-[#66758c]">
                      saved
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-xs text-[#66758c]">
                  {contact.mobile || contact.email || "Available on chat"}
                </span>
              </span>
              {mode === "multi" ? (
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full border ${
                    isSelected
                      ? "border-[#128c7e] bg-[#128c7e] text-white"
                      : "border-[#cfd6e3] text-transparent"
                  }`}
                >
                  <Check size={14} />
                </span>
              ) : (
                <MessageCircle size={18} className="shrink-0 text-[#128c7e]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ContactAvatar({ contact, size = "md" }) {
  const dimensions = size === "sm" ? "size-6 text-[10px]" : "size-11 text-sm";
  const isOnline = contact.status === "online" || contact.status === "active";

  return (
    <span
      className={`relative grid ${dimensions} shrink-0 place-items-center rounded-full bg-[#172033] font-semibold text-white`}
    >
      {contact.profilePic ? (
        <img
          src={contact.profilePic}
          alt=""
          className="size-full rounded-full object-cover"
        />
      ) : (
        getInitials(contact.name)
      )}
      {isOnline && size !== "sm" ? (
        <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-[#25d366]" />
      ) : null}
    </span>
  );
}

function PrimaryButton({ children, disabled, isLoading }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#128c7e] px-4 text-sm font-semibold text-white transition hover:bg-[#0f766d] disabled:bg-[#9aa5b5]"
    >
      {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
      {children}
    </button>
  );
}
