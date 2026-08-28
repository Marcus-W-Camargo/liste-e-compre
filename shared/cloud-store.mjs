export const emptyData = () => ({
  itens: [],
  historico: [],
  sessao: null,
  compras: [],
  edicaoId: null,
});
export class CloudStore {
  constructor(driver) {
    this.driver = driver;
    this.listeners = new Set();
    this.generation = 0;
    this.edits = 0;
    this.pending = null;
    this.running = null;
    this.loading = null;
    this.state = {
      owner: '',
      email: '',
      status: 'idle',
      data: emptyData(),
      revision: 0,
      epoch: 0,
      dirty: false,
      error: '',
      notice: '',
    };
  }
  getSnapshot = () => this.state;
  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  publish(patch) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  reset() {
    this.generation++;
    this.edits = 0;
    this.pending = null;
    this.running = null;
    this.loading = null;
    this.publish({
      owner: '',
      email: '',
      status: 'idle',
      data: emptyData(),
      revision: 0,
      epoch: this.state.epoch + 1,
      dirty: false,
      error: '',
      notice: '',
    });
  }
  async connect(owner, email) {
    if (this.state.owner === owner && this.state.status !== 'idle')
      return this.loading;
    this.reset();
    this.publish({ owner, email, status: 'loading' });
    return this.load(true);
  }
  async load(initial = false) {
    if (this.loading) return this.loading;
    if (!this.state.owner || this.state.dirty || this.running) return;
    const generation = this.generation,
      edits = this.edits,
      { owner, email } = this.state;
    const task = (async () => {
      try {
        const result = await this.driver.load(owner, email);
        if (
          generation !== this.generation ||
          edits !== this.edits ||
          this.state.dirty
        )
          return;
        const changed = initial || result.revision !== this.state.revision;
        this.publish({
          status: 'ready',
          error: '',
          notice: result.notice ?? this.state.notice,
          ...(changed
            ? {
                data: structuredClone(result.data),
                revision: result.revision,
                epoch: this.state.epoch + 1,
              }
            : {}),
        });
      } catch (error) {
        if (generation === this.generation)
          this.publish({
            status: initial ? 'error' : this.state.status,
            error: error.message,
          });
        if (initial) throw error;
      }
    })();
    this.loading = task;
    try {
      await task;
    } finally {
      if (this.loading === task) this.loading = null;
    }
  }
  mutate(change) {
    if (!this.state.owner || !['ready', 'saving'].includes(this.state.status))
      throw new Error('Aguarde a sincronização dos dados.');
    const next = structuredClone(this.state.data);
    change(next);
    if (JSON.stringify(next) === JSON.stringify(this.state.data)) return;
    this.edits++;
    this.publish({ data: next, dirty: true, status: 'saving', error: '' });
    queueMicrotask(() => void this.flush().catch(() => {}));
  }
  async flush() {
    if (this.running) return this.running;
    if (this.state.status === 'conflict') throw new Error(this.state.error);
    if (!this.state.dirty) return;
    const generation = this.generation,
      owner = this.state.owner;
    this.publish({ status: 'saving', error: '' });
    const task = (async () => {
      try {
        while (this.state.dirty && generation === this.generation) {
          this.pending ??= {
            operation: crypto.randomUUID(),
            revision: this.state.revision,
            data: structuredClone(this.state.data),
            edits: this.edits,
          };
          const sent = this.pending;
          const result = await this.driver.save(
            owner,
            sent.revision,
            sent.operation,
            sent.data,
          );
          if (generation !== this.generation) return;
          if (!result.ok) {
            this.publish({
              status: 'conflict',
              error:
                'Há alterações mais recentes em outro dispositivo. Sua edição não sobrescreveu os dados da nuvem.',
            });
            throw new Error(this.state.error);
          }
          this.pending = null;
          const dirty = this.edits !== sent.edits;
          this.publish({
            revision: result.revision,
            dirty,
            status: dirty ? 'saving' : 'ready',
            error: '',
          });
        }
      } catch (error) {
        if (generation === this.generation && this.state.status !== 'conflict')
          this.publish({ status: 'error', error: error.message });
        throw error;
      }
    })();
    this.running = task;
    try {
      await task;
    } finally {
      if (this.running === task) this.running = null;
    }
  }
  async retry() {
    return this.state.dirty ? this.flush() : this.load(true);
  }
  async reload() {
    const { owner, email } = this.state;
    this.reset();
    this.publish({ owner, email, status: 'loading' });
    return this.load(true);
  }
}
