import { useState } from "react";

const initialForms = {
  directUserId: "",
  groupName: "",
  groupUsers: "",
  renameGroup: "",
  addUsers: "",
  removeUsers: "",
};

export function ChatActions({
  selectedChat,
  actionLoading,
  hasToken,
  onAccessChat,
  onCreateGroup,
  onUpdateGroup,
  onAddUsers,
  onRemoveUsers,
  onDeleteGroup,
}) {
  const [forms, setForms] = useState(() => ({
    ...initialForms,
    renameGroup: selectedChat?.isGroup ? selectedChat.name : "",
  }));

  const updateField = (event) => {
    const { name, value } = event.target;

    setForms((currentForms) => ({
      ...currentForms,
      [name]: value,
    }));
  };

  const handleDirectSubmit = async (event) => {
    event.preventDefault();
    const result = await onAccessChat(forms.directUserId.trim());

    if (result?.success) {
      setForms((currentForms) => ({ ...currentForms, directUserId: "" }));
    }
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    const result = await onCreateGroup({
      chatName: forms.groupName.trim(),
      users: forms.groupUsers,
    });

    if (result?.success) {
      setForms((currentForms) => ({
        ...currentForms,
        groupName: "",
        groupUsers: "",
      }));
    }
  };

  const handleRenameGroup = async (event) => {
    event.preventDefault();
    await onUpdateGroup(selectedChat.id, { chatName: forms.renameGroup.trim() });
  };

  const handleAddUsers = async (event) => {
    event.preventDefault();
    const result = await onAddUsers(selectedChat.id, forms.addUsers);

    if (result?.success) {
      setForms((currentForms) => ({ ...currentForms, addUsers: "" }));
    }
  };

  const handleRemoveUsers = async (event) => {
    event.preventDefault();
    const result = await onRemoveUsers(selectedChat.id, forms.removeUsers);

    if (result?.success) {
      setForms((currentForms) => ({ ...currentForms, removeUsers: "" }));
    }
  };

  const isBusy = Boolean(actionLoading);

  return (
    <div className="space-y-3 border-b border-[#d9dee8] bg-[#fbfcfe] px-4 py-3 sm:px-5">
      {!hasToken ? (
        <div className="border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-xs leading-5 text-[#92400e]">
          REST actions need a JWT. Auth guards are disabled, so preview data stays visible.
        </div>
      ) : null}

      <form className="grid gap-2" onSubmit={handleDirectSubmit}>
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66758c]">
          Direct chat
        </label>
        <div className="flex gap-2">
          <input
            name="directUserId"
            value={forms.directUserId}
            onChange={updateField}
            placeholder="User ID"
            className="min-w-0 flex-1 border border-[#cfd6e3] bg-white px-3 py-2 text-xs outline-none focus:border-[#2563eb]"
          />
          <button
            type="submit"
            disabled={isBusy || !forms.directUserId.trim()}
            className="bg-[#172033] px-3 py-2 text-xs font-semibold text-white disabled:bg-[#9aa5b5]"
          >
            {actionLoading === "accessChat" ? "Opening..." : "Open"}
          </button>
        </div>
      </form>

      <form className="grid gap-2" onSubmit={handleCreateGroup}>
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66758c]">
          Create group
        </label>
        <input
          name="groupName"
          value={forms.groupName}
          onChange={updateField}
          placeholder="Group name"
          className="border border-[#cfd6e3] bg-white px-3 py-2 text-xs outline-none focus:border-[#2563eb]"
        />
        <div className="flex gap-2">
          <input
            name="groupUsers"
            value={forms.groupUsers}
            onChange={updateField}
            placeholder="User IDs, comma separated"
            className="min-w-0 flex-1 border border-[#cfd6e3] bg-white px-3 py-2 text-xs outline-none focus:border-[#2563eb]"
          />
          <button
            type="submit"
            disabled={isBusy || !forms.groupName.trim() || !forms.groupUsers.trim()}
            className="bg-[#2563eb] px-3 py-2 text-xs font-semibold text-white disabled:bg-[#93aeea]"
          >
            {actionLoading === "createGroup" ? "Creating..." : "Create"}
          </button>
        </div>
      </form>

      {selectedChat?.isGroup ? (
        <div className="space-y-2 border-t border-[#d9dee8] pt-3">
          <form className="flex gap-2" onSubmit={handleRenameGroup}>
            <input
              name="renameGroup"
              value={forms.renameGroup}
              onChange={updateField}
              placeholder="Rename group"
              className="min-w-0 flex-1 border border-[#cfd6e3] bg-white px-3 py-2 text-xs outline-none focus:border-[#2563eb]"
            />
            <button
              type="submit"
              disabled={isBusy || !forms.renameGroup.trim()}
              className="border border-[#cfd6e3] px-3 py-2 text-xs font-semibold disabled:text-[#9aa5b5]"
            >
              Save
            </button>
          </form>

          <form className="flex gap-2" onSubmit={handleAddUsers}>
            <input
              name="addUsers"
              value={forms.addUsers}
              onChange={updateField}
              placeholder="Add user IDs"
              className="min-w-0 flex-1 border border-[#cfd6e3] bg-white px-3 py-2 text-xs outline-none focus:border-[#2563eb]"
            />
            <button
              type="submit"
              disabled={isBusy || !forms.addUsers.trim()}
              className="border border-[#cfd6e3] px-3 py-2 text-xs font-semibold disabled:text-[#9aa5b5]"
            >
              Add
            </button>
          </form>

          <form className="flex gap-2" onSubmit={handleRemoveUsers}>
            <input
              name="removeUsers"
              value={forms.removeUsers}
              onChange={updateField}
              placeholder="Remove user IDs"
              className="min-w-0 flex-1 border border-[#cfd6e3] bg-white px-3 py-2 text-xs outline-none focus:border-[#2563eb]"
            />
            <button
              type="submit"
              disabled={isBusy || !forms.removeUsers.trim()}
              className="border border-[#cfd6e3] px-3 py-2 text-xs font-semibold disabled:text-[#9aa5b5]"
            >
              Remove
            </button>
          </form>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => onDeleteGroup(selectedChat.id)}
            className="w-full border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs font-semibold text-[#991b1b] disabled:text-[#b8a3a3]"
          >
            {actionLoading === "deleteGroup" ? "Deleting..." : "Delete group"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
