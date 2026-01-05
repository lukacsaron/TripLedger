'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
    createGlobalCategory,
    updateGlobalCategory,
    deleteGlobalCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    type CategoryWithSubs
} from '@/lib/actions/categories'

interface CategoryManagerProps {
    categories: CategoryWithSubs[]
}

export function CategoryManager({ categories }: CategoryManagerProps) {
    const [expandedCategories, setExpandedCategories] = useState<string[]>([])
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<CategoryWithSubs | null>(null)
    const [editingSubcategory, setEditingSubcategory] = useState<{ id: string, name: string, categoryId: string } | null>(null)
    const [addingSubcategoryTo, setAddingSubcategoryTo] = useState<string | null>(null)

    const toggleExpand = (id: string) => {
        setExpandedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        )
    }

    // --- Category Handlers ---

    const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const color = formData.get('color') as string

        const result = await createGlobalCategory({ name, color })
        if (result.success) {
            toast.success('Category created')
            setIsCreateDialogOpen(false)
        } else {
            toast.error(result.error || 'Failed to create category')
        }
    }

    const handleUpdateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!editingCategory) return

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const color = formData.get('color') as string

        const result = await updateGlobalCategory(editingCategory.id, { name, color })
        if (result.success) {
            toast.success('Category updated')
            setEditingCategory(null)
        } else {
            toast.error(result.error || 'Failed to update category')
        }
    }

    const handleDeleteCategory = async (id: string) => {
        const result = await deleteGlobalCategory(id)
        if (result.success) {
            toast.success('Category deleted')
        } else {
            toast.error(result.error || 'Failed to delete category')
        }
    }

    // --- Subcategory Handlers ---

    const handleCreateSubcategory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!addingSubcategoryTo) return

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string

        const result = await createSubcategory(addingSubcategoryTo, name)
        if (result.success) {
            toast.success('Subcategory created')
            setAddingSubcategoryTo(null)
            if (!expandedCategories.includes(addingSubcategoryTo)) {
                toggleExpand(addingSubcategoryTo)
            }
        } else {
            toast.error(result.error || 'Failed to create subcategory')
        }
    }

    const handleUpdateSubcategory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!editingSubcategory) return

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string

        const result = await updateSubcategory(editingSubcategory.id, name)
        if (result.success) {
            toast.success('Subcategory updated')
            setEditingSubcategory(null)
        } else {
            toast.error(result.error || 'Failed to update subcategory')
        }
    }

    const handleDeleteSubcategory = async (id: string) => {
        const result = await deleteSubcategory(id)
        if (result.success) {
            toast.success('Subcategory deleted')
        } else {
            toast.error(result.error || 'Failed to delete subcategory')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Global Categories</h2>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Category</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateCategory} className="space-y-4">
                            <div className="space-y-2">
                                <Input name="name" placeholder="Category Name" required />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="color"
                                        name="color"
                                        className="w-12 h-10 p-1"
                                        defaultValue="#E5E7EB"
                                    />
                                    <span className="text-sm text-muted-foreground">Pick a color</span>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-3">
                {categories.map(category => (
                    <Card key={category.id} className="overflow-hidden">
                        <div className="p-3 flex items-center gap-3">
                            <button
                                onClick={() => toggleExpand(category.id)}
                                className="hover:bg-accent/50 p-1 rounded transition-colors"
                                disabled={category.subcategories.length === 0}
                            >
                                {expandedCategories.includes(category.id) ? (
                                    <ChevronDown className={`w-4 h-4 ${category.subcategories.length === 0 ? 'text-muted-foreground/30' : ''}`} />
                                ) : (
                                    <ChevronRight className={`w-4 h-4 ${category.subcategories.length === 0 ? 'text-muted-foreground/30' : ''}`} />
                                )}
                            </button>

                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                style={{ backgroundColor: category.color }}
                            >
                                {category.name.slice(0, 2).toUpperCase()}
                            </div>

                            <div className="flex-1 font-medium">{category.name}</div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setAddingSubcategoryTo(category.id)}
                                    title="Add Subcategory"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setEditingCategory(category)}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This cannot be undone. You can only delete categories that have no expenses linked to them.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>

                        {/* Subcategories */}
                        {expandedCategories.includes(category.id) && (
                            <div className="bg-muted/30 border-t px-10 py-2 space-y-1">
                                {category.subcategories.map(sub => (
                                    <div key={sub.id} className="flex items-center justify-between group py-1">
                                        <span className="text-sm">{sub.name}</span>
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => setEditingSubcategory({ ...sub, categoryId: category.id })}
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive">
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Subcategory?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This cannot be undone. Only empty subcategories can be deleted.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteSubcategory(sub.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                                {category.subcategories.length === 0 && (
                                    <div className="text-xs text-muted-foreground py-1">No subcategories</div>
                                )}
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* Edit Category Dialog */}
            <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateCategory} className="space-y-4">
                        <div className="space-y-2">
                            <Input name="name" defaultValue={editingCategory?.name} required />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="color"
                                    name="color"
                                    className="w-12 h-10 p-1"
                                    defaultValue={editingCategory?.color}
                                />
                                <span className="text-sm text-muted-foreground">Pick a color</span>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Update</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Subcategory Dialog */}
            <Dialog open={!!addingSubcategoryTo} onOpenChange={(open) => !open && setAddingSubcategoryTo(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Subcategory</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubcategory} className="space-y-4">
                        <div className="space-y-2">
                            <Input name="name" placeholder="Subcategory Name" required />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Subcategory Dialog */}
            <Dialog open={!!editingSubcategory} onOpenChange={(open) => !open && setEditingSubcategory(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Subcategory</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateSubcategory} className="space-y-4">
                        <div className="space-y-2">
                            <Input name="name" defaultValue={editingSubcategory?.name} required />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Update</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
