import { exportToExcel, exportToPdf } from '../api/exportApi';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { FileSpreadsheet, FileText } from 'lucide-solid';

function ExportButtons(props) {
  if (!props.formData) return null;

  const handleExport = async (type) => {
    try {
      if (type === 'excel') {
        await exportToExcel(props.formData);
      } else {
        await exportToPdf(props.formData);
      }
    } catch (error) {
      alert(`Ошибка при экспорте: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Экспорт отчета</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex gap-4">
          <Button
            onClick={() => handleExport('excel')}
            variant="secondary"
            class="flex-1"
            size="lg"
          >
            <FileSpreadsheet size={20} class="mr-2" />
            Скачать Excel
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            variant="secondary"
            class="flex-1"
            size="lg"
          >
            <FileText size={20} class="mr-2" />
            Скачать PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ExportButtons;

