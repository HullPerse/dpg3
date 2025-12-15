import { useEffect, useState } from "react";
import ItemsApi from "@/api/items.api";
import UsersApi from "@/api/users.api";
import { noTax, electricityTax, lifeTax } from "@/config/items.config";
import { getCellTax } from "@/lib/utils";

const usersApi = new UsersApi();
const itemsApi = new ItemsApi();

export function useCalculatedTax(userId?: string, cellLevel?: number) {
  const [calculatedTax, setCalculatedTax] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const calculateTax = async () => {
      if (!userId || cellLevel === undefined) {
        setCalculatedTax(null);
        return;
      }

      setIsLoading(true);
      
      try {
        const baseTax = getCellTax(cellLevel).money;
        const [isNoTax, isElectricityTax, isLifeTax] = await Promise.all([
          usersApi.itemAvailability(userId, noTax),
          usersApi.itemAvailability(userId, electricityTax),
          usersApi.itemAvailability(userId, lifeTax),
        ]);

        let finalTax = baseTax;
        
        if (isNoTax) {
          const inventory = await itemsApi.getInventory(userId);
          const noTaxItem = inventory.find((item) => item.itemId === noTax);
          
          if (noTaxItem) {
            await usersApi.removeItem(noTaxItem.id);
            finalTax = 0;
          }
        } else if (isElectricityTax) {
          const electricityInventory = await itemsApi.getInventory(userId);
          const electricityItem = electricityInventory.find((item) => item.itemId === electricityTax);
          
          if (electricityItem) {
            await usersApi.removeItem(electricityItem.id);
            finalTax = baseTax * 4;
          }
        } else if (isLifeTax) {
          const lifeInventory = await itemsApi.getInventory(userId);
          const lifeItem = lifeInventory.find((item) => item.itemId === lifeTax);
          
          if (lifeItem) {
            await usersApi.removeItem(lifeItem.id);
            finalTax = baseTax * 10;
          }
        }

        setCalculatedTax(finalTax);
      } catch (error) {
        console.error("Error calculating tax:", error);
        setCalculatedTax(cellLevel ? getCellTax(cellLevel).money : null);
      } finally {
        setIsLoading(false);
      }
    };

    calculateTax();
  }, [userId, cellLevel]);

  return { calculatedTax, isLoading };
}