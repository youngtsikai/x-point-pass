import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPassUpdateComponent } from './admin-pass-update.component';

describe('AdminPassUpdateComponent', () => {
  let component: AdminPassUpdateComponent;
  let fixture: ComponentFixture<AdminPassUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPassUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPassUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
