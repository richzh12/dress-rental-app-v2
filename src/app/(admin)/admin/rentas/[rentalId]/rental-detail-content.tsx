'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateRentalStatusAction,
  addPaymentAction,
  cancelRentalAction,
  updateDepositPaidAction,
} from './actions';

type RentalStatus = 'RESERVED' | 'RENTED' | 'RETURNED' | 'COMPLETED' | 'CANCELLED';
type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';

interface RentalCustomer {
  firstName: string;
  lastName: string;
}

interface RentalDetail {
  id: string;
  status: string;
  notes: string | null;
  balanceDueCents: number;
  customer: RentalCustomer;
}

interface RentalDetailContentProps {
  rental: RentalDetail;
}

export function RentalDetailContent({ rental }: RentalDetailContentProps) {
  const router = useRouter();
  const [status, setStatus] = useState<RentalStatus>(rental.status as RentalStatus);
  const [depositPaid, setDepositPaid] = useState(
    rental.notes?.includes('[[DEPOSIT_PAID:yes]]') ?? false
  );
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountError, setAmountError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const canTransition = (from: string, to: string) => {
    const transitions: Record<string, string[]> = {
      RESERVED: ['RENTED', 'CANCELLED'],
      RENTED: ['RETURNED', 'CANCELLED'],
      RETURNED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };
    return transitions[from]?.includes(to) || false;
  };

  const handleStatusChange = async (newStatus: RentalStatus) => {
    if (!canTransition(status, newStatus)) {
      setMessage('Transición de estado no permite');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      await updateRentalStatusAction(rental.id, newStatus);
      setStatus(newStatus);
      setMessage(`Estado actualizado a ${newStatus}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error actualizando estado');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAmountError('');
    setMessage('');

    const amount = parseFloat(paymentAmount);
    if (!paymentAmount || isNaN(amount) || amount <= 0) {
      setAmountError('Ingresa un monto válido');
      return;
    }

    if (Math.round(amount * 100) > rental.balanceDueCents) {
      setAmountError('El monto no puede exceder el saldo pendiente');
      return;
    }

    try {
      setLoading(true);
      await addPaymentAction(rental.id, Math.round(amount * 100), paymentMethod);
      setPaymentAmount('');
      setShowPaymentForm(false);
      setMessage('Pago registrado exitosamente');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error registrando pago');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar este alquiler?')) return;

    try {
      setLoading(true);
      setMessage('');
      await cancelRentalAction(rental.id);
      setStatus('CANCELLED');
      setMessage('Alquiler cancelado');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error cancelando alquiler');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDeposit = async () => {
    const nextValue = !depositPaid;

    try {
      setLoading(true);
      setMessage('');
      await updateDepositPaidAction(rental.id, nextValue);
      setDepositPaid(nextValue);
      setMessage(`Depósito marcado como ${nextValue ? 'pagado' : 'no pagado'}`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error actualizando depósito');
    } finally {
      setLoading(false);
    }
  };

  const nextStatus =
    status === 'RESERVED'
      ? 'RENTED'
      : status === 'RENTED'
        ? 'RETURNED'
        : status === 'RETURNED'
          ? 'COMPLETED'
          : null;

  return (
    <div className="atelier-card space-y-4 p-6">
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            message.includes('Error')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {nextStatus && (
          <button
            onClick={() => handleStatusChange(nextStatus)}
            disabled={loading}
            className="atelier-btn-primary px-4 py-2 disabled:opacity-50 font-medium"
          >
            {loading ? 'Actualizando...' : `Marcar como ${nextStatus.toLowerCase()}`}
          </button>
        )}

        {status !== 'COMPLETED' && status !== 'CANCELLED' && (
          <button
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            disabled={loading}
            className="rounded-lg border border-[#9fd2b5] bg-[#e4f5eb] px-4 py-2 font-medium text-[#2d8a5a] disabled:opacity-50"
          >
            + Agregar Pago
          </button>
        )}

        {status !== 'COMPLETED' && status !== 'CANCELLED' && (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 font-medium"
          >
            Cancelar Alquiler
          </button>
        )}

        <button
          onClick={handleToggleDeposit}
          disabled={loading}
          className={`rounded-lg border px-4 py-2 font-medium disabled:opacity-50 ${
            depositPaid
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          {depositPaid ? 'Marcar depósito como no pagado' : 'Marcar depósito como pagado'}
        </button>
      </div>

      {showPaymentForm && (
        <form onSubmit={handleAddPayment} className="space-y-4 rounded-lg border border-[#eadfce] bg-[#fbf7ef] p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto a pagar
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => {
                  setPaymentAmount(e.target.value);
                  setAmountError('');
                }}
                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {amountError && <p className="text-red-600 text-sm mt-1">{amountError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg border border-[#9fd2b5] bg-[#e4f5eb] px-4 py-2 font-medium text-[#2d8a5a] disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Registrar Pago'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPaymentForm(false);
                setPaymentAmount('');
                setAmountError('');
              }}
              disabled={loading}
              className="atelier-btn-soft px-4 py-2 disabled:opacity-50 font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
