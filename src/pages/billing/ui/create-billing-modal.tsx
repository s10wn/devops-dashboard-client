import { useState, useEffect, type ChangeEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
} from '@shared/ui';
import { TEAM_SERVERS_QUERY } from '@entities/server';
import { CREATE_BILLING_MUTATION, UPDATE_BILLING_MUTATION } from '@entities/billing';

type Server = {
  id: string;
  name: string;
  host: string;
};

type TeamServersData = {
  teamServers: Server[];
};

type Billing = {
  id: string;
  amount: number;
  currency: string;
  notes?: string;
  server: Server;
};

type CreateBillingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  billing?: Billing | null;
  onSuccess: () => void;
};

const currencyOptions = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'RUB', label: 'RUB' },
];

export const CreateBillingModal = ({
  isOpen,
  onClose,
  teamId,
  billing,
  onSuccess,
}: CreateBillingModalProps) => {
  const isEdit = !!billing;

  const [serverId, setServerId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');

  const { data: serversData } = useQuery<TeamServersData>(TEAM_SERVERS_QUERY, {
    variables: { teamId },
    skip: !teamId,
  });

  const servers = serversData?.teamServers || [];

  const [createBilling, { loading: creating }] = useMutation(CREATE_BILLING_MUTATION, {
    onCompleted: () => {
      onSuccess();
      handleClose();
    },
  });

  const [updateBilling, { loading: updating }] = useMutation(UPDATE_BILLING_MUTATION, {
    onCompleted: () => {
      onSuccess();
      handleClose();
    },
  });

  useEffect(() => {
    if (billing) {
      setServerId(billing.server.id);
      setAmount(billing.amount.toString());
      setCurrency(billing.currency);
      setNotes(billing.notes || '');
    } else {
      resetForm();
    }
  }, [billing, isOpen]);

  const resetForm = () => {
    setServerId('');
    setAmount('');
    setCurrency('USD');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (isEdit) {
      updateBilling({
        variables: {
          input: {
            billingId: billing.id,
            amount: parseFloat(amount),
            currency,
            notes: notes || undefined,
          },
        },
      });
    } else {
      createBilling({
        variables: {
          input: {
            serverId,
            amount: parseFloat(amount),
            currency,
            notes: notes || undefined,
          },
        },
      });
    }
  };

  const isValid = (isEdit || serverId) && amount;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader onClose={handleClose}>
        {isEdit ? 'Редактировать биллинг' : 'Добавить биллинг'}
      </ModalHeader>
      <ModalBody>
        <div className="billing-form">
          {!isEdit && (
            <Select
              label="Сервер"
              value={serverId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setServerId(e.target.value)}
              required
            >
              <option value="">Выберите сервер</option>
              {servers.map((server: Server) => (
                <option key={server.id} value={server.id}>
                  {server.name} ({server.host})
                </option>
              ))}
            </Select>
          )}

          <div className="billing-form__row">
            <Input
              label="Сумма"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="29.99"
              required
            />
            <Select
              label="Валюта"
              value={currency}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setCurrency(e.target.value)}
            >
              {currencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Заметки"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Дополнительная информация..."
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          Отмена
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={creating || updating}
          disabled={!isValid}
        >
          {isEdit ? 'Сохранить' : 'Создать'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
