"use client"

import * as React from "react"
import {CalendarIcon, Clock2Icon} from "lucide-react"

import {Button} from "@/components/ui/button.tsx"
import {Card, CardContent} from "@/components/ui/card"
import {InputGroup, InputGroupAddon, InputGroupInput,} from "@/components/ui/input-group"
import {Field, FieldGroup, FieldLabel} from "@/components/ui/field.tsx"
import {Calendar} from "@/components/ui/calendar.tsx"
import {cn} from "@/lib/utils.ts"

type DateAndTimePickerProps = {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const DEFAULT_TIME = "09:00"

function formatDatePart(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

function parseDatePart(value: string) {
    if (!value) {
        return undefined
    }

    const [datePart] = value.split("T")
    const [year, month, day] = datePart.split("-").map(Number)

    if (!year || !month || !day) {
        return undefined
    }

    return new Date(year, month - 1, day)
}

function getTimePart(value: string) {
    return value.split("T")[1] ?? ""
}

function formatDisplayDate(date: Date | undefined) {
    return date
        ? new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(date)
        : "Select date"
}

export function DateAndTimePicker({
                                      id,
                                      label,
                                      value,
                                      onChange,
                                      className,
                                  }: DateAndTimePickerProps) {
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
    const selectedDate = React.useMemo(() => parseDatePart(value), [value])
    const time = getTimePart(value)

    function handleDateSelect(date: Date | undefined) {
        if (!date) {
            onChange("")
            return
        }

        onChange(`${formatDatePart(date)}T${time || DEFAULT_TIME}`)
        setIsCalendarOpen(false)
    }

    function handleTimeChange(nextTime: string) {
        if (!nextTime) {
            onChange(selectedDate ? `${formatDatePart(selectedDate)}T${DEFAULT_TIME}` : "")
            return
        }

        onChange(`${formatDatePart(selectedDate ?? new Date())}T${nextTime}`)
    }

    return (
        <Card size="sm" className={cn("date-time-picker w-full", className)}>
            <CardContent>
                <FieldGroup className="gap-3">
                    <Field>
                        <FieldLabel htmlFor={`${id}-date`}>{label}</FieldLabel>
                        <Button
                            id={`${id}-date`}
                            className="date-time-picker-date-button h-9 justify-start rounded-lg border border-input bg-white px-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            type="button"
                            variant="ghost"
                            aria-expanded={isCalendarOpen}
                            onClick={() => setIsCalendarOpen((current) => !current)}
                        >
                            <CalendarIcon className="size-4 text-muted-foreground"/>
                            <span className="min-w-0 truncate">{formatDisplayDate(selectedDate)}</span>
                        </Button>
                    </Field>
                    {isCalendarOpen && (
                        <div className="date-time-picker-calendar">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                className="p-0 w-full"
                            />
                        </div>
                    )}
                    <Field>
                        <FieldLabel htmlFor={id}>Time</FieldLabel>
                        <InputGroup>
                            <InputGroupInput
                                id={id}
                                type="time"
                                step="60"
                                value={time}
                                onChange={(event) => handleTimeChange(event.currentTarget.value)}
                                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            />
                            <InputGroupAddon>
                                <Clock2Icon className="text-muted-foreground"/>
                            </InputGroupAddon>
                        </InputGroup>
                    </Field>
                    <Button
                        className="h-8 rounded-lg px-3 text-xs font-bold"
                        type="button"
                        variant="ghost"
                        onClick={() => onChange("")}
                    >
                        Clear
                    </Button>
                </FieldGroup>
            </CardContent>
        </Card>
    )
}
