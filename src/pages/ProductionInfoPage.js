import React from 'react';

function ProductionInfoPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-semibold mb-4">Собственное производство</h1>
      <p className="text-muted mb-6">
        Мы сами отбираем ткани, контролируем пошив и упаковку. Так держим качество и сроки под контролем.
      </p>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Материалы</h2>
          <p className="text-sm text-muted">
            Используем хлопок, сатин, поплин и микрофибру надёжных поставщиков. Каждый рулон проходит входной контроль и тесты на стойкость окраса.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Пошив</h2>
          <p className="text-sm text-muted">
            Работаем по стандартам лёгкой промышленности: аккуратные швы, усиленные углы, скрытые молнии. Каждая партия проходит выборочный осмотр.
          </p>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">Экологичность и упаковка</h2>
        <ul className="list-disc list-inside text-sm text-muted space-y-1">
          <li>Используем тканевые и картонные упаковки, пригодные для вторичной переработки.</li>
          <li>Оптимизируем крои, чтобы снижать отходы.</li>
          <li>Работаем с локальными партнёрами, сокращая логистический след.</li>
        </ul>
      </div>
    </div>
  );
}

export default ProductionInfoPage;
