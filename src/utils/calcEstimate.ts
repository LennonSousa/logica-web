import { Panel } from '../components/Panels';
import { RoofOrientation } from '../components/RoofOrientations';
import { EstimateItem } from '../components/EstimateItems';
import { prettifyCurrency } from '../components/InputMask/masks';

export interface ConsumptionCalcProps {
    kwh: number,
    irradiation: number,
    panel: Panel,
    month_01: number,
    month_02: number,
    month_03: number,
    month_04: number,
    month_05: number,
    month_06: number,
    month_07: number,
    month_08: number,
    month_09: number,
    month_10: number,
    month_11: number,
    month_12: number,
    month_13: number,
    averageIncrease: number,
    roofOrientation: RoofOrientation,
}

export interface CalcProps {
    discount_percent: boolean,
    discount: number,
    increase_percent: boolean,
    increase: number,
    estimateItems: EstimateItem[],
}

export interface CalcResultProps {
    monthsAverageKwh: number,
    finalAverageKwh: number,
    monthlyPaid: number,
    yearlyPaid: number,
    panelsAmount: number,
    systemCapacityKwp: number,
    monthlyGeneratedEnergy: number,
    yearlyGeneratedEnergy: number,
    co2Reduction: number,
    systemArea: number,
    finalSystemCapacityKwp: number,
    systemInitialPrice: number,
    estimateItems: EstimateItem[];
}

export function handleFormConsumptionValues(values: any, panels: Panel[], roofOrientations: RoofOrientation[]) {
    try {
        const panel = panels.find(panel => { return panel.id === values['panel'] });
        const roofOrientation = roofOrientations.find(roofOrientation => { return roofOrientation.id === values['roof_orientation'] });

        if (!panel || !roofOrientation) return undefined;

        const valuesCalcItem: ConsumptionCalcProps = {
            kwh: Number(values['kwh'].replaceAll('.', '').replaceAll(',', '.')),
            irradiation: Number(values['irradiation'].replaceAll('.', '').replaceAll(',', '.')),
            panel,
            month_01: Number(values['month_01'].replaceAll('.', '').replaceAll(',', '.')),
            month_02: Number(values['month_02'].replaceAll('.', '').replaceAll(',', '.')),
            month_03: Number(values['month_03'].replaceAll('.', '').replaceAll(',', '.')),
            month_04: Number(values['month_04'].replaceAll('.', '').replaceAll(',', '.')),
            month_05: Number(values['month_05'].replaceAll('.', '').replaceAll(',', '.')),
            month_06: Number(values['month_06'].replaceAll('.', '').replaceAll(',', '.')),
            month_07: Number(values['month_07'].replaceAll('.', '').replaceAll(',', '.')),
            month_08: Number(values['month_08'].replaceAll('.', '').replaceAll(',', '.')),
            month_09: Number(values['month_09'].replaceAll('.', '').replaceAll(',', '.')),
            month_10: Number(values['month_10'].replaceAll('.', '').replaceAll(',', '.')),
            month_11: Number(values['month_11'].replaceAll('.', '').replaceAll(',', '.')),
            month_12: Number(values['month_12'].replaceAll('.', '').replaceAll(',', '.')),
            month_13: Number(values['month_13'].replaceAll('.', '').replaceAll(',', '.')),
            averageIncrease: Number(values['average_increase'].replaceAll('.', '').replaceAll(',', '.')),
            roofOrientation,
        }

        return valuesCalcItem;
    }
    catch {
        return undefined;
    }
}

export function handleFormValues(values: any, estimateItemsList: EstimateItem[]) {
    try {
        const valuesCalcItem: CalcProps = {
            discount_percent: values['discount_percent'],
            discount: Number(values['discount'].replaceAll('.', '').replaceAll(',', '.')),
            increase_percent: values['increase_percent'],
            increase: Number(values['increase'].replaceAll('.', '').replaceAll(',', '.')),
            estimateItems: estimateItemsList,
        }

        return valuesCalcItem;
    }
    catch {
        return undefined;
    }
}

export function calculate(consumptionProps: ConsumptionCalcProps, estimateItems: EstimateItem[], newCalc: boolean) {
    const consumptionValues: ConsumptionCalcProps = {
        kwh: Number(consumptionProps.kwh),
        irradiation: Number(consumptionProps.irradiation),
        panel: consumptionProps.panel,
        month_01: Number(consumptionProps.month_01),
        month_02: Number(consumptionProps.month_02),
        month_03: Number(consumptionProps.month_03),
        month_04: Number(consumptionProps.month_04),
        month_05: Number(consumptionProps.month_05),
        month_06: Number(consumptionProps.month_06),
        month_07: Number(consumptionProps.month_07),
        month_08: Number(consumptionProps.month_08),
        month_09: Number(consumptionProps.month_09),
        month_10: Number(consumptionProps.month_10),
        month_11: Number(consumptionProps.month_11),
        month_12: Number(consumptionProps.month_12),
        month_13: Number(consumptionProps.month_13),
        averageIncrease: Number(consumptionProps.averageIncrease),
        roofOrientation: consumptionProps.roofOrientation,
    }

    // Average
    const sum = consumptionValues.month_01
        + consumptionValues.month_02
        + consumptionValues.month_03
        + consumptionValues.month_04
        + consumptionValues.month_05
        + consumptionValues.month_06
        + consumptionValues.month_07
        + consumptionValues.month_08
        + consumptionValues.month_09
        + consumptionValues.month_10
        + consumptionValues.month_11
        + consumptionValues.month_12
        + consumptionValues.month_13;

    const monthsAverageKwh = sum / 13;

    // Final average
    const finalAverageKwh = monthsAverageKwh + consumptionValues.averageIncrease;


    // Monthly and yearly paid
    const monthlyPaid = finalAverageKwh * consumptionValues.kwh;
    const yearlyPaid = monthlyPaid * 13;

    // System capacity kWp
    const systemCapacityKwp = finalAverageKwh / consumptionValues.roofOrientation.increment;

    const foundCapacity = consumptionValues.panel.prices.find(price => { return systemCapacityKwp <= price.potency });

    if (!foundCapacity) {
        return undefined;
    }

    // Amount panels.
    let panelsAmount = Math.ceil((foundCapacity.potency / consumptionValues.panel.capacity) * 1000);

    // System area
    const systemArea = panelsAmount * 2.1;

    // System initial price.
    let systemSubTotal = foundCapacity.price;

    // Amount structs.
    const structsAmount = Math.ceil(panelsAmount / 4);

    // Generated engergy.
    const monthlyGeneratedEnergy = foundCapacity.potency * consumptionValues.roofOrientation.increment;
    const yearlyGeneratedEnergy = monthlyGeneratedEnergy * 12;

    // Co2 reduction
    const co2Reduction = monthlyGeneratedEnergy * 0.255 * 12;

    let tempTotal = 0;

    let tempEstimateItems: EstimateItem[] = estimateItems.map(estimateItem => {
        if (estimateItem.order === 0) {
            return {
                ...estimateItem,
                name: newCalc ? foundCapacity.inversor : estimateItem.name,
                amount: newCalc ? 1 : estimateItem.amount,
                price: newCalc ? (systemSubTotal * estimateItem.percent / 100 / estimateItem.amount) : estimateItem.price,
            }
        }

        if (estimateItem.order === 1) {
            if (!newCalc) panelsAmount = Number(estimateItem.amount);

            return {
                ...estimateItem,
                name: newCalc ? `${consumptionValues.panel.name} - ${prettifyCurrency(String(consumptionValues.panel.capacity))} W` : estimateItem.name,
                amount: panelsAmount,
                price: newCalc ? (systemSubTotal * estimateItem.percent / 100 / panelsAmount) : estimateItem.price,
            }
        }

        if (estimateItem.order === 2) {
            return {
                ...estimateItem,
                amount: newCalc ? structsAmount : estimateItem.amount,
                price: newCalc ? (systemSubTotal * estimateItem.percent / 100 / structsAmount) : estimateItem.price,
            }
        }

        return {
            ...estimateItem,
            price: newCalc ? (systemSubTotal * estimateItem.percent / 100) : estimateItem.price,
        }
    });

    tempEstimateItems.forEach(item => {
        tempTotal = Number(tempTotal) + item.amount * item.price;
    });

    systemSubTotal = tempTotal;

    const valuesReturn: CalcResultProps = {
        monthsAverageKwh,
        finalAverageKwh,
        monthlyPaid,
        yearlyPaid,
        panelsAmount,
        systemCapacityKwp,
        monthlyGeneratedEnergy,
        yearlyGeneratedEnergy,
        co2Reduction,
        systemArea,
        finalSystemCapacityKwp: Number(foundCapacity.potency),
        systemInitialPrice: systemSubTotal,
        estimateItems: tempEstimateItems,
    }

    return valuesReturn;
}

export function calcFinalTotal(subTotal: number, isDiscountPercent: boolean, discountValue: number, isIncreasePercent: boolean, increaseValue: number) {
    // Discount and increase.    
    const parsedSubTotal = Number(subTotal);
    const parsedDiscountValue = Number(discountValue);
    const parsedIncreaseValue = Number(increaseValue);

    let finalPrice = parsedSubTotal;

    if (isDiscountPercent) finalPrice -= (finalPrice * parsedDiscountValue / 100);
    else finalPrice -= parsedDiscountValue;

    if (increaseValue > 0) {
        if (isIncreasePercent) finalPrice += (finalPrice * parsedIncreaseValue / 100);
        else finalPrice += parsedIncreaseValue;
    }

    return finalPrice;
}

export function calcDiscountPercent(initialValue: number, finalValue: number) {
    const totalDiscount = initialValue - finalValue;

    return Math.fround((totalDiscount / initialValue) * 100);
}