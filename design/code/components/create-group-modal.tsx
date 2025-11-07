import * as React from "react"
import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Label } from "./ui/label"
import { Checkbox } from "./ui/checkbox"

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateGroup: (groupName: string, memberIds: string[]) => Promise<void>
  availableUsers: Array<{ id: string; username: string }>
  isLoading?: boolean
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onCreateGroup,
  availableUsers,
  isLoading = false,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())

  const handleToggleMember = (userId: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedMembers(newSelected)
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("Por favor, digite um nome para o grupo")
      return
    }

    if (selectedMembers.size === 0) {
      alert("Por favor, selecione pelo menos um membro")
      return
    }

    try {
      await onCreateGroup(groupName, Array.from(selectedMembers))
      setGroupName("")
      setSelectedMembers(new Set())
      onClose()
    } catch (error) {
      console.error("Erro ao criar grupo:", error)
      alert("Erro ao criar grupo. Tente novamente.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Group Name Input */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Nome do Grupo</Label>
            <Input
              id="group-name"
              placeholder="Ex: Projeto React"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Members Selection */}
          <div className="space-y-2">
            <Label>Adicionar Membros</Label>
            <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md p-3 bg-muted/30">
              {availableUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum usuário disponível</p>
              ) : (
                availableUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`member-${user.id}`}
                      checked={selectedMembers.has(user.id)}
                      onCheckedChange={() => handleToggleMember(user.id)}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor={`member-${user.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {user.username}
                    </label>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedMembers.size} membro{selectedMembers.size !== 1 ? "s" : ""} selecionado{selectedMembers.size !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateGroup}
            disabled={isLoading || !groupName.trim() || selectedMembers.size === 0}
          >
            {isLoading ? "Criando..." : "Criar Grupo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
