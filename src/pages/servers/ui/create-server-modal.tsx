import { useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CREATE_SERVER_MUTATION } from '@entities/server';
import { Modal, ModalHeader, ModalBody, ModalFooter, Input, Button } from '@shared/ui';

const createServerSchema = yup.object({
  name: yup.string().min(2, 'Минимум 2 символа').required('Обязательное поле'),
  host: yup.string().required('Обязательное поле'),
  port: yup
    .number()
    .min(1, 'Порт от 1 до 65535')
    .max(65535, 'Порт от 1 до 65535')
    .required('Обязательное поле'),
  checkType: yup
    .string()
    .oneOf(['PING', 'TCP', 'HTTP'] as const)
    .required('Выберите тип проверки'),
  httpPath: yup.string().optional(),
  checkInterval: yup
    .number()
    .min(30, 'Минимум 30 секунд')
    .max(3600, 'Максимум 3600 секунд')
    .required('Обязательное поле'),
  provider: yup.string().optional(),
  monthlyPrice: yup
    .number()
    .min(0, 'Цена не может быть отрицательной')
    .optional()
    .nullable()
    .transform((value, original) => (original === '' ? null : value)),
});

type CreateServerFormData = yup.InferType<typeof createServerSchema>;

type CreateServerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onSuccess: () => void;
};

export const CreateServerModal = ({
  isOpen,
  onClose,
  teamId,
  onSuccess,
}: CreateServerModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateServerFormData>({
    resolver: yupResolver(createServerSchema) as never,
    defaultValues: {
      port: 80,
      checkType: 'HTTP',
      httpPath: '/',
      checkInterval: 60,
    },
  });

  const checkType = watch('checkType');

  const [createServer, { loading, error }] = useMutation(CREATE_SERVER_MUTATION, {
    onCompleted: () => {
      reset();
      onSuccess();
    },
  });

  const onSubmit = (data: CreateServerFormData) => {
    createServer({
      variables: {
        input: {
          teamId,
          name: data.name,
          host: data.host,
          port: data.port,
          checkType: data.checkType,
          checkInterval: data.checkInterval,
          httpPath: data.checkType === 'HTTP' ? data.httpPath : undefined,
          provider: data.provider || undefined,
          monthlyPrice: data.monthlyPrice || undefined,
        },
      },
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader onClose={handleClose}>Добавить сервер</ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody>
          {error && <div className="form-error">{error.message}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Название"
              placeholder="Production Server"
              error={errors.name?.message}
              {...register('name')}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <Input
                label="Хост"
                placeholder="example.com или 192.168.1.1"
                error={errors.host?.message}
                {...register('host')}
              />

              <Input
                label="Порт"
                type="number"
                error={errors.port?.message}
                {...register('port', { valueAsNumber: true })}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                Тип проверки
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['HTTP', 'TCP', 'PING'] as const).map((type) => (
                  <label
                    key={type}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.5rem',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      background: checkType === type ? 'var(--bg-tertiary)' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      value={type}
                      {...register('checkType')}
                      style={{ display: 'none' }}
                    />
                    {type}
                  </label>
                ))}
              </div>
              {errors.checkType && (
                <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>
                  {errors.checkType.message}
                </span>
              )}
            </div>

            {checkType === 'HTTP' && (
              <Input
                label="HTTP путь"
                placeholder="/health"
                hint="Путь для проверки (например /health или /api/status)"
                error={errors.httpPath?.message}
                {...register('httpPath')}
              />
            )}

            <Input
              label="Интервал проверки (сек)"
              type="number"
              hint="Как часто проверять сервер (30-3600 секунд)"
              error={errors.checkInterval?.message}
              {...register('checkInterval', { valueAsNumber: true })}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Провайдер"
                placeholder="Hetzner, DO, AWS..."
                hint="Хостинг-провайдер сервера"
                error={errors.provider?.message}
                {...register('provider')}
              />

              <Input
                label="Цена в месяц"
                type="number"
                step="0.01"
                placeholder="29.99"
                hint="Стоимость сервера в месяц"
                error={errors.monthlyPrice?.message}
                {...register('monthlyPrice', { valueAsNumber: true })}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Добавить
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
