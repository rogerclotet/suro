import { useEffect, useState } from 'react'

const useItemCategories = (list, onUpdateItems) => {
  const [itemsByCategory, setItemsByCategory] = useState({})

  useEffect(() => {
    if (list === undefined) {
      return
    }

    const newItemsByCategory = {}
    list.items.forEach(item => {
      if (!(item.category in newItemsByCategory)) {
        newItemsByCategory[item.category] = [item]
      } else {
        newItemsByCategory[item.category].push(item)
      }
    })
    setItemsByCategory(newItemsByCategory)
  }, [list])

  const createCategory = name => {
    setItemsByCategory(itemsByCategory => ({ ...itemsByCategory, [name]: [] }))
  }

  const renameCategory = (original, newName) => {
    const originalItems = itemsByCategory[original]
    const items = originalItems.map(item => ({
      id: item.id,
      category: newName,
    }))

    // eslint-disable-next-line no-unused-vars
    const { [original]: _, ...restByCategory } = itemsByCategory

    setItemsByCategory({
      ...restByCategory,
      [newName]: originalItems.map(item => ({ ...item, category: newName })),
    })

    onUpdateItems(items)
  }

  return { itemsByCategory, setItemsByCategory, createCategory, renameCategory }
}

export default useItemCategories
